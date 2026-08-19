/**
 * Tests para api/upload.ts
 *
 * Mockea AWS SDK v3 y Vercel runtime.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest } from '@vercel/node';

// --------------------------------------------------------------
// Mocks
// --------------------------------------------------------------

vi.mock('@aws-sdk/client-s3', () => {
  const mockSend = vi.fn();
  const MockS3Client = vi.fn(function MockS3Client() {
    return { send: mockSend };
  });

  return {
    S3Client: MockS3Client,
    PutObjectCommand: vi.fn(),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(),
}));

vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(() => [{ name: 'test-app' }]),
  initializeApp: vi.fn(),
  cert: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({ verifyIdToken: vi.fn().mockResolvedValue({ uid: 'admin-1' }) })),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'admin' }) }),
      })),
    })),
  })),
}));

// --------------------------------------------------------------
// Helpers de test
// --------------------------------------------------------------

function createRequest(body: Record<string, unknown>, method = 'POST') {
  return {
    method,
    headers: {
      authorization: 'Bearer valid-admin-token',
    },
    body,
  } as unknown as VercelRequest;
}

function createResponse() {
  let _statusCode = 200;
  let _jsonPayload: Record<string, unknown> = {};

  return {
    status: (code: number) => {
      _statusCode = code;
      return {
        json: (payload: Record<string, unknown>) => {
          _jsonPayload = payload;
          return { statusCode: _statusCode, jsonPayload: _jsonPayload };
        },
      };
    },
    get statusCode() { return _statusCode; },
    get jsonPayload() { return _jsonPayload; },
    setHeader: vi.fn(),
  } as unknown as VercelResponse;
}

// --------------------------------------------------------------
// Tests
// --------------------------------------------------------------

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
    const req = createRequest({}, 'GET');
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
  });

  it('returns 401 when authorization header is missing', async () => {
    const handler = (await import('../../../api/upload')).default;
    const req = {
      method: 'POST',
      headers: {},
      body: { fileName: 'test.jpg', fileType: 'image/jpeg' },
    } as VercelRequest;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when fileName is missing', async () => {
    const handler = (await import('../../../api/upload')).default;
    const req = createRequest({ fileType: 'image/jpeg' });
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when fileType is missing', async () => {
    const handler = (await import('../../../api/upload')).default;
    const req = createRequest({ fileName: 'test.jpg' });
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid file extension', async () => {
    const handler = (await import('../../../api/upload')).default;
    const req = createRequest({ fileName: 'test.exe', fileType: 'application/octet-stream' });
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid content type', async () => {
    const handler = (await import('../../../api/upload')).default;
    const req = createRequest({ fileName: 'test.jpg', fileType: 'application/pdf' });
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when file is too large', async () => {
    const handler = (await import('../../../api/upload')).default;
    const req = createRequest({ fileName: 'test.jpg', fileType: 'image/jpeg', fileSize: 10 * 1024 * 1024 });
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('returns 500 when AWS env is missing', async () => {
    delete process.env.AWS_S3_BUCKET;
    delete process.env.AWS_REGION;

    const handler = (await import('../../../api/upload')).default;
    const req = createRequest({ fileName: 'test.jpg', fileType: 'image/jpeg', fileSize: 1024 });
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
  });

  it('returns 200 with presigned URL on success', async () => {
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    vi.mocked(getSignedUrl).mockResolvedValue('https://signed-url' as unknown as never);

    const handler = (await import('../../../api/upload')).default;
    const req = createRequest({ fileName: 'photo.jpg', fileType: 'image/jpeg', fileSize: 1024 });
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const payload = res.jsonPayload as { success: boolean; data: { uploadUrl: string; key: string; publicUrl: string } };
    expect(payload.success).toBe(true);
    expect(payload.data.uploadUrl).toBe('https://signed-url');
    expect(payload.data.key).toMatch(/^products\/[0-9a-f-]+\.jpg$/);
    expect(payload.data.publicUrl).toContain('test-bucket');
  });
});


