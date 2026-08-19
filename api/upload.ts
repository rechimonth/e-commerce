/**
 * Vercel Serverless Function: genera presigned PUT URLs para imágenes de productos.
 *
 * El navegador nunca recibe credenciales AWS. Primero se valida el Firebase ID token
 * y el rol admin mediante firebase-admin; recién después se firma la operación S3.
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const PRESIGNED_URL_EXPIRY_SECONDS = 300;

function getFirebaseAdminApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin environment is not configured');
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

function isAllowedContentType(value: string): boolean {
  return ALLOWED_CONTENT_TYPES.has(value.split(';')[0]?.trim().toLowerCase() ?? '');
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
    console.error('Firebase token verification failed');
    return jsonError(res, 401, 'Invalid Firebase ID token');
  }

  const body = req.body;
  if (!body || typeof body !== 'object') return jsonError(res, 400, 'Invalid request body');
  const { fileName, fileType, fileSize, prefix = 'products', orderId } = body as Record<string, unknown>;
  if (typeof fileName !== 'string' || !fileName.trim()) return jsonError(res, 400, 'fileName is required and must be a string');
  if (typeof fileType !== 'string' || !fileType.trim()) return jsonError(res, 400, 'fileType is required and must be a string');
  if (typeof fileSize !== 'number' || !Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE_BYTES) {
    return jsonError(res, 400, 'Invalid file size. Maximum is 5 MB');
  }
  if (orderId !== undefined && typeof orderId !== 'string') return jsonError(res, 400, 'orderId must be a string when provided');

  const extension = getExtension(fileName);
  if (!ALLOWED_EXTENSIONS.has(extension)) return jsonError(res, 400, 'Invalid file extension');
  if (!isAllowedContentType(fileType)) return jsonError(res, 400, 'Invalid content type');

  const safePrefix = typeof prefix === 'string' ? prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) : 'products';
  if (!safePrefix) return jsonError(res, 400, 'Invalid prefix');

  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!bucket || !region || !accessKeyId || !secretAccessKey) return jsonError(res, 500, 'AWS environment is not configured');

  const key = `${safePrefix}/${crypto.randomUUID()}.${extension}`;

  try {
    const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType.split(';')[0]?.trim().toLowerCase(),
      ACL: 'public-read',
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS });
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, '/')}`;

    const app = getFirebaseAdminApp();
    const firestore = getFirestore(app);
    const uploadMeta = {
      key,
      url: publicUrl,
      fileName,
      fileType,
      fileSize,
      prefix: safePrefix,
      orderId: orderId ?? null,
      createdAt: serverTimestamp(),
    };

    await firestore.collection('uploads').doc(key).set(uploadMeta);

    if (orderId) {
      const orderRef = doc(firestore, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const currentAttachments = (orderSnap.data()?.attachments ?? []) as Array<{
          key: string;
          url: string;
          name: string;
          uploadedAt: unknown;
        }>;
        await updateDoc(orderRef, {
          attachments: [
            ...currentAttachments,
            {
              key,
              url: publicUrl,
              name: fileName,
              uploadedAt: serverTimestamp(),
            },
          ],
          updatedAt: serverTimestamp(),
        });
      }
    }

    return res.status(200).json({ success: true, data: { uploadUrl, key, publicUrl, expiresIn: PRESIGNED_URL_EXPIRY_SECONDS } });
  } catch (error) {
    console.error('S3 presigned URL generation failed:', error instanceof Error ? error.message : 'unknown');
    return jsonError(res, 500, 'Failed to generate upload URL');
  }
}
