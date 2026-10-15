import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mocks = vi.hoisted(() => ({
  uid: 'admin-1',
  role: 'admin',
  order: { status: 'pending', statusHistory: [] as unknown[], items: [] as Array<{ productId: string; quantity: number }> },
  products: new Map<string, { stock: number }>(),
  update: vi.fn(),
  delete: vi.fn(),
  timestamp: vi.fn(() => ({ type: 'timestamp' })),
  headers: {} as Record<string, string>,
}));

vi.mock('firebase-admin/app', () => ({
  cert: vi.fn(),
  getApps: vi.fn(() => [{ name: 'test-app' }]),
  initializeApp: vi.fn(),
}));
vi.mock('../../../server/firebaseToken.js', () => ({
  verifyFirebaseIdToken: vi.fn(async () => ({ uid: mocks.uid })),
}));
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: vi.fn(() => ({ type: 'serverTimestamp' })) },
  Timestamp: { now: mocks.timestamp },
  getFirestore: vi.fn(() => ({
    collection: vi.fn((collectionName: string) => ({
      doc: vi.fn((id?: string) => ({
        id: id ?? 'order-1',
        collectionName,
        get: async () => ({ exists: true, data: () => ({ role: mocks.role }) }),
      })),
    })),
    runTransaction: vi.fn(async (callback: (transaction: unknown) => Promise<void>) => callback({
      get: async (ref: { collectionName?: string; id?: string }) => {
        if (ref.collectionName === 'products') {
          const product = mocks.products.get(ref.id ?? '');
          return { exists: Boolean(product), data: () => product };
        }
        return { exists: true, data: () => mocks.order };
      },
      update: mocks.update,
      delete: mocks.delete,
    })),
  })),
}));

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'OPTIONS';

function createRequest(body: Record<string, unknown> = {}, method: HttpMethod = 'POST'): VercelRequest {
  return {
    method,
    headers: { authorization: 'Bearer test-token' },
    body,
  } as unknown as VercelRequest;
}

function createResponse() {
  let statusCode = 200;
  let jsonPayload: Record<string, unknown> = {};
  mocks.headers = {};
  const response = {
    setHeader(name: string, value: string) {
      mocks.headers[name] = value;
      return response;
    },
    status(code: number) {
      statusCode = code;
      return {
        json(payload: Record<string, unknown>) {
          jsonPayload = payload;
          return response;
        },
        end() {
          return response;
        },
      };
    },
    get statusCode() { return statusCode; },
    get jsonPayload() { return jsonPayload; },
  };
  return response as unknown as VercelResponse & typeof response;
}

describe('/api/update-order-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = 'admin-1';
    mocks.role = 'admin';
    mocks.order = { status: 'pending', statusHistory: [], items: [] };
    mocks.products.clear();
    mocks.headers = {};
  });

  it('persists a valid admin transition transactionally with POST', async () => {
    const handler = (await import('../../../api/update-order-status')).default;
    const response = createResponse();

    await handler(createRequest({ orderId: 'order-1', status: 'processing' }, 'POST'), response);

    expect(response.statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'order-1' }),
      expect.objectContaining({
        status: 'processing',
        statusHistory: [expect.objectContaining({ from: 'pending', to: 'processing', by: 'admin-1', timestamp: { type: 'timestamp' } })],
      }),
    );
  });

  it.each(['PATCH', 'PUT'] as const)('accepts %s for a status transition', async (method) => {
    const handler = (await import('../../../api/update-order-status')).default;
    const response = createResponse();

    await handler(createRequest({ orderId: 'order-1', status: 'processing' }, method), response);

    expect(response.statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'order-1' }),
      expect.objectContaining({ status: 'processing' }),
    );
  });

  it('restores reserved stock when an admin cancels a pending order', async () => {
    mocks.order = {
      status: 'pending',
      statusHistory: [],
      items: [{ productId: 'product-1', quantity: 2 }],
    };
    mocks.products.set('product-1', { stock: 3 });
    const handler = (await import('../../../api/update-order-status')).default;
    const response = createResponse();

    await handler(createRequest({ orderId: 'order-1', status: 'cancelled' }), response);

    expect(response.statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: 'products', id: 'product-1' }),
      expect.objectContaining({ stock: 5 }),
    );
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: 'orders', id: 'order-1' }),
      expect.objectContaining({ status: 'cancelled' }),
    );
  });

  it('supports legacy DELETE clients and removes documents transactionally', async () => {
    const handler = (await import('../../../api/update-order-status')).default;
    const response = createResponse();

    await handler(createRequest({ orderId: 'order-1' }, 'DELETE'), response);

    expect(response.statusCode).toBe(200);
    expect(response.jsonPayload).toEqual({ success: true, deletedOrderIds: ['order-1'] });
    expect(mocks.delete).toHaveBeenCalledWith(expect.objectContaining({ id: 'order-1' }));
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('handles OPTIONS without reporting an unsupported method', async () => {
    const handler = (await import('../../../api/update-order-status')).default;
    const response = createResponse();

    await handler(createRequest({}, 'OPTIONS'), response);

    expect(response.statusCode).toBe(204);
    expect(mocks.headers.Allow).toContain('OPTIONS');
  });

  it('returns 405 and Allow for genuinely unsupported methods', async () => {
    const handler = (await import('../../../api/update-order-status')).default;
    const response = createResponse();

    await handler(createRequest({}, 'GET'), response);

    expect(response.statusCode).toBe(405);
    expect(response.jsonPayload.error).toContain('Method not allowed');
    expect(mocks.headers.Allow).toContain('PATCH');
  });

  it('rejects non-admin callers without updating an order', async () => {
    mocks.role = 'customer';
    const handler = (await import('../../../api/update-order-status')).default;
    const response = createResponse();

    await handler(createRequest({ orderId: 'order-1', status: 'processing' }), response);

    expect(response.statusCode).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('rejects invalid state transitions without writing to Firestore', async () => {
    const handler = (await import('../../../api/update-order-status')).default;
    const response = createResponse();

    await handler(createRequest({ orderId: 'order-1', status: 'completed' }), response);

    expect(response.statusCode).toBe(409);
    expect(response.jsonPayload.error).toBe('Invalid order status transition');
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
