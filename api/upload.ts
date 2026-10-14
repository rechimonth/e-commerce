import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const CONTENT_TYPES_BY_EXTENSION: Readonly<Record<string, string>> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
};
const PRESIGNED_URL_EXPIRY_SECONDS = 300;

function normalizePrivateKey(value: string): string {
  let key = value.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  return key.replace(/\\r?\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\r/g, '\r').trim();
}

function getFirebaseAdminApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyValue = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = privateKeyValue ? normalizePrivateKey(privateKeyValue) : '';
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin environment is not configured');
  }
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
    throw new Error('Firebase Admin private key has an invalid format');
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

async function verifyAdmin(idToken: string): Promise<{ uid: string }> {
  const app = getFirebaseAdminApp();
  const decoded = await getAuth(app).verifyIdToken(idToken);
  const profile = await getFirestore(app).collection('users').doc(decoded.uid).get();
  if (!profile.exists || profile.data()?.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return { uid: decoded.uid };
}

function getExtension(fileName: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
  return match?.[1]?.toLowerCase() ?? '';
}

function jsonError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}

function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const configured = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((v) => v.trim()).filter(Boolean);
  const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
  const allowed = origin && (configured.includes(origin) || origin === vercelOrigin);
  if (allowed) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');

  const authHeader = req.headers.authorization ?? '';
  if (!authHeader.startsWith('Bearer ')) return jsonError(res, 401, 'Missing or invalid authorization header');
  const token = authHeader.slice(7).trim();
  if (!token) return jsonError(res, 401, 'Missing Firebase ID token');

  try {
    await verifyAdmin(token);
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') return jsonError(res, 403, 'Admin role required');
    console.error('Firebase token verification failed:', error instanceof Error ? error.message : 'unknown error');
    return jsonError(res, 401, 'Invalid Firebase ID token');
  }

  const body = req.body;
  if (!body || typeof body !== 'object') return jsonError(res, 400, 'Invalid request body');
  const { fileName, fileType, fileSize, prefix = 'products', orderId } = body as Record<string, unknown>;
  if (typeof fileName !== 'string' || !fileName.trim()) return jsonError(res, 400, 'fileName is required and must be a string');
  if (fileName.length > 255 || /[\\/\u0000-\u001f]/.test(fileName)) return jsonError(res, 400, 'Invalid file name');
  if (typeof fileType !== 'string' || !fileType.trim() || fileType.includes(';')) return jsonError(res, 400, 'fileType is invalid');
  if (typeof fileSize !== 'number' || !Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE_BYTES) {
    return jsonError(res, 400, 'Invalid file size. Maximum is 5 MB');
  }
  if (prefix !== 'products' && prefix !== 'orders') return jsonError(res, 400, 'Invalid upload prefix');
  if (prefix === 'orders' && (typeof orderId !== 'string' || !orderId.trim() || orderId.length > 128)) {
    return jsonError(res, 400, 'A valid orderId is required for order attachments');
  }
  if (prefix === 'products' && orderId !== undefined) return jsonError(res, 400, 'Product uploads cannot include an orderId');

  const extension = getExtension(fileName);
  const contentType = CONTENT_TYPES_BY_EXTENSION[extension];
  if (!contentType || contentType !== fileType.trim().toLowerCase()) {
    return jsonError(res, 400, 'File extension and content type do not match');
  }
  if (prefix === 'products' && contentType === 'application/pdf') {
    return jsonError(res, 400, 'Product images must use an image format');
  }

  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!bucket || !region || !accessKeyId || !secretAccessKey) return jsonError(res, 500, 'AWS environment is not configured');

  const key = `${prefix}/${crypto.randomUUID()}.${extension}`;

  try {
    const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    const signedPost = await createPresignedPost(s3, {
      Bucket: bucket,
      Key: key,
      Expires: PRESIGNED_URL_EXPIRY_SECONDS,
      Fields: { 'Content-Type': contentType },
      Conditions: [
        ['content-length-range', 1, MAX_FILE_SIZE_BYTES],
        ['eq', '$Content-Type', contentType],
      ],
    });
    const publicUrl = prefix === 'products'
      ? `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, '/')}`
      : '';

    return res.status(200).json({
      success: true,
      data: {
        uploadUrl: signedPost.url,
        fields: signedPost.fields,
        key,
        publicUrl,
        expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
      },
    });
  } catch (error) {
    console.error('S3 presigned URL generation failed:', error instanceof Error ? error.message : 'unknown');
    return jsonError(res, 500, 'Failed to generate upload URL');
  }
}
