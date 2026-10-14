import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mocks = vi.hoisted(() => ({
  uid: 'customer-1',
  order: { userId: 'customer-1', status: 'pending', statusHistory: [] as unknown[], items: [] as Array<{ productId: string; quantity: number }> },
  products: new Map<string, { stock: number }>(),
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
      doc: vi.fn((id: string) => ({ id, collectionName })),
    })),
    runTransaction: vi.fn(async (callback: (transaction: unknown) => Promise<void>) => callback({
      get: async (ref: { collectionName: string; id: string }) => {
        if (ref.collectionName === 'products') {
          const product = mocks.products.get(ref.id);
          return { exists: Boolean(product), data: () => product };
        }
        return { exists: true, data: () => mocks.order };
      },
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

describe('POST /api/cancel-order', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = 'customer-1';
    mocks.order = { userId: 'customer-1', status: 'pending', statusHistory: [], items: [] };
    mocks.products.clear();
  });

  it('cancels a pending order belonging to the authenticated customer', async () => {
    const handler = (await import('../../../api/cancel-order')).default;
    const response = createResponse();

    await handler(createRequest({ orderId: 'order-1' }), response);

    expect(response.statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'order-1' }),
      expect.objectContaining({
        status: 'cancelled',
        statusHistory: [expect.objectContaining({ from: 'pending', to: 'cancelled', by: 'customer-1' })],
      }),
    );
  });

  it('rejects cancellation when the caller does not own the order', async () => {
    mocks.order = { userId: 'customer-2', status: 'pending', statusHistory: [] };
    const handler = (await import('../../../api/cancel-order')).default;
    const response = createResponse();

    await handler(createRequest({ orderId: 'order-1' }), response);

    expect(response.statusCode).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('rejects cancellation when the order is no longer pending', async () => {
    mocks.order = { userId: 'customer-1', status: 'processing', statusHistory: [] };
    const handler = (await import('../../../api/cancel-order')).default;
    const response = createResponse();

    await handler(createRequest({ orderId: 'order-1' }), response);

    expect(response.statusCode).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('restores the reserved stock in the same transaction', async () => {
    mocks.order.items = [{ productId: 'product-1', quantity: 2 }];
    mocks.products.set('product-1', { stock: 3 });
    const handler = (await import('../../../api/cancel-order')).default;
    const response = createResponse();

    await handler(createRequest({ orderId: 'order-1' }), response);

    expect(response.statusCode).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: 'products', id: 'product-1' }),
      expect.objectContaining({ stock: 5 }),
    );
  });
});
