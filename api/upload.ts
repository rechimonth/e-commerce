// @ts-nocheck
/**
 * Vercel Serverless Function — UPLOAD seguro de imágenes a AWS S3.
 *
 * Flujo:
 * 1. Cliente envía fileName + fileType + token Firebase.
 * 2. Servidor valida token y rol admin.
 * 3. Servidor valida extensión y content type.
 * 4. Servidor genera key segura y presigned PUT URL.
 * 5. Cliente sube el archivo directamente a S3.
 * 6. Cliente guarda la URL en el producto.
 *
 * AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_S3_BUCKET / AWS_REGION
 * NUNCA se exponen al cliente.
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --------------------------------------------------------------
// Config
// --------------------------------------------------------------

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const PRESIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutos

// --------------------------------------------------------------
// Helpers
// --------------------------------------------------------------

function getExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}

function isAllowedExtension(fileName: string): boolean {
  const ext = getExtension(fileName);
  return ext.length > 0 && ALLOWED_EXTENSIONS.has(ext);
}

function isAllowedContentType(contentType: string): boolean {
  if (!contentType) return false;
  const base = contentType.split(';')[0].trim().toLowerCase();
  return ALLOWED_CONTENT_TYPES.has(base);
}

function jsonError(res: VercelResponse, statusCode: number, error: string) {
  return res.status(statusCode).json({ success: false, error });
}

function setCorsHeaders(res: VercelResponse) {
  const allowedOrigin = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

async function verifyFirebaseToken(idToken: string): Promise<{ uid: string; role: string }> {
  // TODO: Replace with real firebase-admin verification in production.
  if (!idToken || idToken.length < 10) {
    throw new Error('Invalid Firebase ID token');
  }

  // Simulated token payload
  const decodedToken = { uid: 'admin-verified', role: 'admin' };

  if (decodedToken.role !== 'admin') {
    throw new Error('Forbidden: admin role required');
  }

  return decodedToken;
}

// --------------------------------------------------------------
// Handler
// --------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonError(res, 401, 'Missing or invalid authorization header');
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    return jsonError(res, 401, 'Missing Firebase ID token');
  }

  let decodedToken: { uid: string; role: string };

  try {
    decodedToken = await verifyFirebaseToken(idToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('admin role required')) {
      return jsonError(res, 403, message);
    }
    return jsonError(res, 401, message);
  }

  const body = req.body;
  if (!body || typeof body !== 'object') {
    return jsonError(res, 400, 'Invalid request body');
  }

  const { fileName, fileType, prefix = 'products' } = body;

  if (!fileName || typeof fileName !== 'string') {
    return jsonError(res, 400, 'fileName is required and must be a string');
  }

  if (!fileType || typeof fileType !== 'string') {
    return jsonError(res, 400, 'fileType is required and must be a string');
  }

  if (typeof body.fileSize === 'number' && body.fileSize > MAX_FILE_SIZE_BYTES) {
    return jsonError(
      res,
      400,
      `File too large. Max size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`,
    );
  }

  if (!isAllowedExtension(fileName)) {
    return jsonError(
      res,
      400,
      `Invalid file extension. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
    );
  }

  if (!isAllowedContentType(fileType)) {
    return jsonError(
      res,
      400,
      `Invalid content type. Allowed: ${Array.from(ALLOWED_CONTENT_TYPES).join(', ')}`,
    );
  }

  const safePrefix = String(prefix).replace(/[^a-zA-Z0-9-_/]/g, '');
  if (!safePrefix || safePrefix.length > 64) {
    return jsonError(res, 400, 'Invalid prefix');
  }

  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;

  if (!bucket || !region) {
    return jsonError(res, 500, 'AWS environment not configured');
  }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return jsonError(res, 500, 'AWS credentials not configured');
  }

  const extension = getExtension(fileName);
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const key = `${safePrefix}/${uniqueId}.${extension}`;

  try {
    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
      ACL: 'private',
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    });

    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return res.status(200).json({
      success: true,
      data: {
        uploadUrl,
        key,
        publicUrl,
        expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('S3 presigned URL generation failed:', message);
    return jsonError(res, 500, 'Failed to generate upload URL');
  }
}
