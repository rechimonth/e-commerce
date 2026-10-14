/**
 * Tests para api/upload.ts
 *
 * Mockea AWS SDK v3 y Vercel runtime.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

vi.mock('@aws-sdk/client-s3', () => ({ S3Client: vi.fn(function S3Client() { return {}; }) }));

vi.mock('@aws-sdk/s3-presigned-post', () => ({
  createPresignedPost: vi.fn().mockResolvedValue({
    url: 'https://test-bucket.s3.us-east-1.amazonaws.com',
    fields: { key: 'products/test-key.jpg', Policy: 'signed-policy' },
  }),
}));

vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(() => [{ name: 'test-app' }]),
  initializeApp: vi.fn(),
  cert: vi.fn(),
}));

vi.mock('../../../server/firebaseToken.js', () => ({
  verifyFirebaseIdToken: vi.fn().mockResolvedValue({ uid: 'admin-1' }),
}));

vi.mock('firebase-admin/firestore', () => {
  const mockDoc = vi.fn(() => ({
    get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'admin', attachments: [] }) }),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  }));
  const mockCollection = vi.fn(() => ({ doc: mockDoc, add: vi.fn() }));
  const serverTimestamp = vi.fn(() => ({ _type: 'serverTimestamp' }));
  return {
    getFirestore: vi.fn(() => ({ collection: mockCollection, doc: mockDoc })),
    doc: mockDoc,
    getDoc: vi.fn(async (ref: { get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> }> }) => ref.get()),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    serverTimestamp,
    FieldValue: { serverTimestamp },
  };
});

function createRequest(body: Record<string, unknown>, method = 'POST') {
  return { method, headers: { authorization: 'Bearer valid-admin-token' }, body } as unknown as VercelRequest;
}

function createResponse() {
  let _statusCode = 200;
  let _jsonPayload: Record<string, unknown> = {};
  return {
    status: (code: number) => {
      _statusCode = code;
      return { json: (payload: Record<string, unknown>) => { _jsonPayload = payload; return { statusCode: _statusCode, jsonPayload: _jsonPayload }; } };
    },
    get statusCode() { return _statusCode; },
    get jsonPayload() { return _jsonPayload; },
    setHeader: vi.fn(),
  } as unknown as VercelResponse;
}

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AWS_S3_BUCKET = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
  });

  it('returns 405 for non-POST methods', async () => {
    const handler = (await import('../../../api/upload')).default;
    const res = createResponse();
    await handler(createRequest({}, 'GET'), res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 401 when authorization header is missing', async () => {
    const handler = (await import('../../../api/upload')).default;
    const res = createResponse();
    await handler({ method: 'POST', headers: {}, body: { fileName: 'test.jpg', fileType: 'image/jpeg' } } as VercelRequest, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when fileName is missing', async () => {
    const handler = (await import('../../../api/upload')).default;
    const res = createResponse();
    await handler(createRequest({ fileType: 'image/jpeg' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when fileType is missing', async () => {
    const handler = (await import('../../../api/upload')).default;
    const res = createResponse();
    await handler(createRequest({ fileName: 'test.jpg' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid file extension', async () => {
    const handler = (await import('../../../api/upload')).default;
    const res = createResponse();
    await handler(createRequest({ fileName: 'test.exe', fileType: 'application/octet-stream' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid content type', async () => {
    const handler = (await import('../../../api/upload')).default;
    const res = createResponse();
    await handler(createRequest({ fileName: 'test.jpg', fileType: 'application/pdf' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('requires extension and content type to match', async () => {
    const handler = (await import('../../../api/upload')).default;
    const res = createResponse();
    await handler(createRequest({ fileName: 'test.jpg', fileType: 'image/png', fileSize: 1024 }), res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when file is too large', async () => {
    const handler = (await import('../../../api/upload')).default;
    const res = createResponse();
    await handler(createRequest({ fileName: 'test.jpg', fileType: 'image/jpeg', fileSize: 10 * 1024 * 1024 }), res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 500 when AWS env is missing', async () => {
    delete process.env.AWS_S3_BUCKET;
    delete process.env.AWS_REGION;
    const handler = (await import('../../../api/upload')).default;
    const res = createResponse();
    await handler(createRequest({ fileName: 'test.jpg', fileType: 'image/jpeg', fileSize: 1024 }), res);
    expect(res.statusCode).toBe(500);
  });

  it('returns a presigned POST with an enforced size and content type policy', async () => {
    const { createPresignedPost } = await import('@aws-sdk/s3-presigned-post');
    const handler = (await import('../../../api/upload')).default;
    const res = createResponse();
    await handler(createRequest({ fileName: 'photo.jpg', fileType: 'image/jpeg', fileSize: 1024 }), res);
    expect(res.statusCode).toBe(200);
    const payload = res.jsonPayload as {
      success: boolean;
      data: { uploadUrl: string; fields: Record<string, string>; key: string; publicUrl: string };
    };
    expect(payload.success).toBe(true);
    expect(payload.data.uploadUrl).toBe('https://test-bucket.s3.us-east-1.amazonaws.com');
    expect(payload.data.key).toMatch(/^products\/[0-9a-f-]+\.jpg$/);
    expect(payload.data.fields.Policy).toBe('signed-policy');
    expect(payload.data.publicUrl).toContain('test-bucket');
    expect(createPresignedPost).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        Conditions: [
          ['content-length-range', 1, 5 * 1024 * 1024],
          ['eq', '$Content-Type', 'image/jpeg'],
        ],
        Fields: { 'Content-Type': 'image/jpeg' },
      }),
    );
  });

  it('allows a PDF only for an order attachment', async () => {
    const handler = (await import('../../../api/upload')).default;
    const rejected = createResponse();
    await handler(createRequest({ fileName: 'receipt.pdf', fileType: 'application/pdf', fileSize: 1024 }), rejected);
    expect(rejected.statusCode).toBe(400);

    const allowed = createResponse();
    await handler(createRequest({
      fileName: 'receipt.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      prefix: 'orders',
      orderId: 'order-1',
    }), allowed);
    expect(allowed.statusCode).toBe(200);
  });

  it('rejects unknown upload prefixes', async () => {
    const handler = (await import('../../../api/upload')).default;
    const res = createResponse();
    await handler(createRequest({
      fileName: 'photo.jpg',
      fileType: 'image/jpeg',
      fileSize: 1024,
      prefix: '../users',
    }), res);
    expect(res.statusCode).toBe(400);
  });
});
