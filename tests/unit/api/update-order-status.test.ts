import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mocks = vi.hoisted(() => ({
  uid: 'admin-1',
  role: 'admin',
  order: { status: 'pending', statusHistory: [] as unknown[] },
  update: vi.fn(),
}));

vi.mock('firebase-admin/app', () => ({
  cert: vi.fn(),
  getApps: vi.fn(() => [{ name: 'test-app' }]),
  initializeApp: vi.fn(),
}));
vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({ verifyIdToken: vi.fn(async () => ({ uid: mocks.uid })) })),
}));
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: vi.fn(() => ({ type: 'serverTimestamp' })) },
  getFirestore: vi.fn(() => ({
    collection: vi.fn((collectionName: string) => ({
      doc: vi.fn(() => ({
        id: 'order-1',
        collectionName,
        get: async () => ({ exists: true, data: () => ({ role: mocks.role }) }),
      })),
    })),
    runTransaction: vi.fn(async (callback: (transaction: unknown) => Promise<void>) => callback({
      get: async () => ({ exists: true, data: () => mocks.order }),
      update: mocks.update,
    })),
  })),
}));

function createRequest(body: Record<string, unknown>): VercelRequest {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer test-token' },
    body,
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

describe('POST /api/update-order-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = 'admin-1';
    mocks.role = 'admin';
    mocks.order = { status: 'pending', statusHistory: [] };
  });

  it('appends an authenticated admin transition transactionally', async () => {
    const handler = (await import('../../../api/update-order-status')).default;
    const response = createResponse();

    await handler(createRequest({ orderId: 'order-1', status: 'processing' }), response);

    expect(response.statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'order-1' }),
      expect.objectContaining({
        status: 'processing',
        statusHistory: [expect.objectContaining({ from: 'pending', to: 'processing', by: 'admin-1' })],
      }),
    );
  });

  it('rejects non-admin callers', async () => {
    mocks.role = 'customer';
    const handler = (await import('../../../api/update-order-status')).default;
    const response = createResponse();

    await handler(createRequest({ orderId: 'order-1', status: 'processing' }), response);

    expect(response.statusCode).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('rejects invalid state transitions', async () => {
    mocks.order = { status: 'pending', statusHistory: [] };
    const handler = (await import('../../../api/update-order-status')).default;
    const response = createResponse();

    await handler(createRequest({ orderId: 'order-1', status: 'completed' }), response);

    expect(response.statusCode).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
