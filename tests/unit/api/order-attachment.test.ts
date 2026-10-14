import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mocks = vi.hoisted(() => ({
  callerUid: 'customer-1',
  role: 'customer',
  orderUserId: 'customer-1',
  getSignedUrl: vi.fn(),
  getOrder: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: vi.fn(function GetObjectCommand(input: unknown) { return input; }),
  S3Client: vi.fn(function S3Client() { return {}; }),
}));
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: mocks.getSignedUrl }));
vi.mock('firebase-admin/app', () => ({
  cert: vi.fn(),
  getApps: vi.fn(() => [{ name: 'test-app' }]),
  initializeApp: vi.fn(),
}));
vi.mock('../../../server/firebaseToken.js', () => ({
  verifyFirebaseIdToken: vi.fn(async () => ({ uid: mocks.callerUid })),
}));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn((collectionName: string) => ({
      doc: vi.fn((id: string) => ({
        get: async () => collectionName === 'users'
          ? { exists: true, data: () => ({ role: mocks.role }) }
          : mocks.getOrder(id),
      })),
    })),
  })),
}));

function createRequest(query: Record<string, string> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: { authorization: 'Bearer test-token' },
    query: { orderId: 'order-1', key: 'orders/123e4567-e89b-12d3-a456-426614174000.pdf', ...query },
  } as unknown as VercelRequest;
}

function createResponse() {
  let statusCode = 200;
  let jsonPayload: Record<string, unknown> = {};
  const response = {
    status(code: number) {
      statusCode = code;
      return {
        json(payload: Record<string, unknown>) {
          jsonPayload = payload;
          return response;
        },
      };
    },
    get statusCode() { return statusCode; },
    get jsonPayload() { return jsonPayload; },
  };
  return response as unknown as VercelResponse & typeof response;
}

describe('GET /api/order-attachment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.callerUid = 'customer-1';
    mocks.role = 'customer';
    mocks.orderUserId = 'customer-1';
    mocks.getOrder.mockImplementation(async () => ({
      exists: true,
      data: () => ({
        userId: mocks.orderUserId,
        attachments: [{ key: 'orders/123e4567-e89b-12d3-a456-426614174000.pdf' }],
      }),
    }));
    mocks.getSignedUrl.mockResolvedValue('https://signed.example/file');
    process.env.AWS_S3_BUCKET = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
  });

  it('returns a short-lived URL to the owner for an attached object', async () => {
    const handler = (await import('../../../api/order-attachment')).default;
    const response = createResponse();

    await handler(createRequest(), response);

    expect(response.statusCode).toBe(200);
    expect(response.jsonPayload).toMatchObject({
      success: true,
      data: { url: 'https://signed.example/file', expiresIn: 120 },
    });
    expect(mocks.getSignedUrl).toHaveBeenCalledOnce();
  });

  it('rejects customers who do not own the order', async () => {
    mocks.orderUserId = 'customer-2';
    const handler = (await import('../../../api/order-attachment')).default;
    const response = createResponse();

    await handler(createRequest(), response);

    expect(response.statusCode).toBe(403);
    expect(mocks.getSignedUrl).not.toHaveBeenCalled();
  });

  it('rejects keys that are not attached to the requested order', async () => {
    const handler = (await import('../../../api/order-attachment')).default;
    const response = createResponse();

    await handler(createRequest({ key: 'orders/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf' }), response);

    expect(response.statusCode).toBe(403);
    expect(mocks.getSignedUrl).not.toHaveBeenCalled();
  });

  it('allows admins to download an order attachment', async () => {
    mocks.callerUid = 'admin-1';
    mocks.role = 'admin';
    mocks.orderUserId = 'customer-1';
    const handler = (await import('../../../api/order-attachment')).default;
    const response = createResponse();

    await handler(createRequest(), response);

    expect(response.statusCode).toBe(200);
    expect(mocks.getSignedUrl).toHaveBeenCalledOnce();
  });
});
