/**
 * Tests para api/upload.ts
 *
 * Mockea AWS SDK v3 y Vercel runtime.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

vi.mock('@aws-sdk/client-s3', () => {
  const mockSend = vi.fn();
  const MockS3Client = vi.fn(function MockS3Client() { return { send: mockSend }; });
  return { S3Client: MockS3Client, PutObjectCommand: vi.fn() };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn() }));

vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(() => [{ name: 'test-app' }]),
  initializeApp: vi.fn(),
  cert: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({ verifyIdToken: vi.fn().mockResolvedValue({ uid: 'admin-1' }) })),
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

  it('returns 200 with presigned URL on success', async () => {
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    vi.mocked(getSignedUrl).mockResolvedValue('https://signed-url' as unknown as never);
    const handler = (await import('../../../api/upload')).default;
    const res = createResponse();
    await handler(createRequest({ fileName: 'photo.jpg', fileType: 'image/jpeg', fileSize: 1024 }), res);
    expect(res.statusCode).toBe(200);
    const payload = res.jsonPayload as { success: boolean; data: { uploadUrl: string; key: string; publicUrl: string } };
    expect(payload.success).toBe(true);
    expect(payload.data.uploadUrl).toBe('https://signed-url');
    expect(payload.data.key).toMatch(/^products\/[0-9a-f-]+\.jpg$/);
    expect(payload.data.publicUrl).toContain('test-bucket');
  });
});
