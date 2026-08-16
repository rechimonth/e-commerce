// @ts-nocheck
/**
 * Vercel Serverless Function — GENERA PRESIGNED URL para AWS S3.
 * AWS_SECRET_ACCESS_KEY y AWS_ACCESS_KEY_ID vienen de las variables de entorno de Vercel,
 * NUNCA del cliente.
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { fileName, fileType, prefix = 'products' } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ success: false, error: 'fileName and fileType required' });
  }

  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;

  if (!bucket || !region) {
    return res.status(500).json({ success: false, error: 'AWS env not configured' });
  }

  const key = `${prefix}/${Date.now()}-${fileName}`;

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: fileType,
    ACL: 'public-read',
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  res.status(200).json({ success: true, data: { uploadUrl, key, publicUrl } });
}
