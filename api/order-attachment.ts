import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FirebaseConfigurationError, getFirebaseAdminApp } from '../server/firebaseAdmin.js';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const DOWNLOAD_URL_EXPIRY_SECONDS = 120;
const ORDER_KEY_PATTERN = /^orders\/[0-9a-f-]+\.(?:jpg|jpeg|png|webp|gif|pdf)$/i;

function jsonError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}

function queryValue(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');

  const authorization = req.headers.authorization ?? '';
  if (!authorization.startsWith('Bearer ')) return jsonError(res, 401, 'Authentication required');

  const orderId = queryValue(req.query.orderId);
  const key = queryValue(req.query.key);
  if (!orderId || orderId.length > 128 || !key || !ORDER_KEY_PATTERN.test(key)) {
    return jsonError(res, 400, 'Invalid attachment request');
  }

  try {
    const app = getFirebaseAdminApp();
    const decoded = await getAuth(app).verifyIdToken(authorization.slice(7).trim());
    const firestore = getFirestore(app);
    const [profile, order] = await Promise.all([
      firestore.collection('users').doc(decoded.uid).get(),
      firestore.collection('orders').doc(orderId).get(),
    ]);

    if (!profile.exists) return jsonError(res, 403, 'Profile not found');
    if (!order.exists) return jsonError(res, 404, 'Order not found');

    const isAdmin = profile.data()?.role === 'admin';
    const orderData = order.data() ?? {};
    const belongsToUser = orderData.userId === decoded.uid;
    const hasAttachment = Array.isArray(orderData.attachments)
      && orderData.attachments.some((attachment: { key?: unknown }) => attachment?.key === key);
    if ((!isAdmin && !belongsToUser) || !hasAttachment) return jsonError(res, 403, 'Attachment access denied');

    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      return jsonError(res, 500, 'AWS environment is not configured');
    }

    const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: 'attachment' }),
      { expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS },
    );
    return res.status(200).json({ success: true, data: { url, expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS } });
  } catch (error) {
    if (error instanceof FirebaseConfigurationError) {
      console.error('Firebase Admin configuration error:', error.message);
      return jsonError(res, 500, 'Firebase server configuration is incomplete');
    }
    console.error('Order attachment URL generation failed:', error instanceof Error ? error.message : 'unknown error');
    return jsonError(res, 401, 'Unable to verify access to this attachment');
  }
}
