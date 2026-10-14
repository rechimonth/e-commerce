import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mocks = vi.hoisted(() => {
  const transaction = {
    get: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
  };
  const firestore = {
    collection: vi.fn(),
    runTransaction: vi.fn(async (callback: (transaction: typeof transaction) => Promise<unknown>) => callback(transaction)),
  };

  return {
    callerUid: 'customer-1',
    users: new Map<string, { role: string }>(),
    products: new Map<string, Record<string, unknown>>(),
    transaction,
    firestore,
  };
});

vi.mock('firebase-admin/app', () => ({
  cert: vi.fn(),
  getApps: vi.fn(() => [{ name: 'test-app' }]),
  initializeApp: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: vi.fn(() => ({ type: 'serverTimestamp' })) },
  getFirestore: vi.fn(() => mocks.firestore),
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
    get statusCode() {
      return statusCode;
    },
    get jsonPayload() {
      return jsonPayload;
    },
  };
  return response as unknown as VercelResponse & typeof response;
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    items: [{ productId: 'product-1', quantity: 2, priceCents: 1 }],
    shippingAddress: { street: '1 Main St', city: 'City', state: 'ST', zipCode: '12345', country: 'US' },
    billingAddress: { street: '1 Main St', city: 'City', state: 'ST', zipCode: '12345', country: 'US' },
    paymentMethod: 'card',
    ...overrides,
  };
}

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.callerUid = 'customer-1';
    mocks.users.clear();
    mocks.products.clear();
    mocks.transaction.get.mockImplementation(async (ref: { collectionName: string; id: string }) => {
      const data = mocks.products.get(ref.id);
      return { exists: Boolean(data), data: () => data };
    });
    mocks.firestore.collection.mockImplementation((collectionName: string) => ({
      doc: (id?: string) => {
        const docId = id ?? 'new-order';
        return {
          id: docId,
          collectionName,
          get: async () => {
            const data = mocks.users.get(docId);
            return { exists: Boolean(data), data: () => data };
          },
        };
      },
    }));
    mocks.firestore.runTransaction.mockImplementation(async (callback) => callback(mocks.transaction));
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ users: [{ localId: mocks.callerUid, disabled: false }] }),
    })));
  });

  it('does not let a customer create an order for another user', async () => {
    mocks.users.set('customer-2', { role: 'customer' });
    const handler = (await import('../../../api/checkout')).default;
    const response = createResponse();

    await handler(createRequest(validBody({ targetUserId: 'customer-2' })), response);

    expect(response.statusCode).toBe(403);
    expect(mocks.firestore.runTransaction).not.toHaveBeenCalled();
  });

  it('lets an admin create an order for a customer using current product prices and stock', async () => {
    mocks.callerUid = 'admin-1';
    mocks.users.set('admin-1', { role: 'admin' });
    mocks.users.set('customer-1', { role: 'customer' });
    mocks.products.set('product-1', {
      name: 'Product One',
      priceCents: 1250,
      currency: 'USD',
      stock: 5,
      isActive: true,
      imageUrl: 'https://example.com/product.jpg',
    });
    const handler = (await import('../../../api/checkout')).default;
    const response = createResponse();

    await handler(createRequest(validBody({ targetUserId: 'customer-1' })), response);

    expect(response.statusCode).toBe(200);
    expect(mocks.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: 'products', id: 'product-1' }),
      expect.objectContaining({ stock: 3 }),
    );
    expect(mocks.transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: 'orders', id: 'new-order' }),
      expect.objectContaining({
        userId: 'customer-1',
        subtotalCents: 2500,
        totalCents: 2500,
      }),
    );
  });

  it('rejects inactive products and leaves stock and orders unchanged', async () => {
    mocks.products.set('product-1', {
      name: 'Inactive Product',
      priceCents: 1250,
      currency: 'USD',
      stock: 5,
      isActive: false,
    });
    const handler = (await import('../../../api/checkout')).default;
    const response = createResponse();

    await handler(createRequest(validBody()), response);

    expect(response.statusCode).toBe(409);
    expect(mocks.transaction.update).not.toHaveBeenCalled();
    expect(mocks.transaction.set).not.toHaveBeenCalled();
  });
});
