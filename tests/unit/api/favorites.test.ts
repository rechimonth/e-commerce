import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mocks = vi.hoisted(() => ({
  uid: 'customer-1',
  documents: [] as Array<{ id: string; data: () => Record<string, unknown> }>,
  getFavorites: vi.fn(async () => ({ docs: [] as Array<{ id: string; data: () => Record<string, unknown> }> })),
  setFavorite: vi.fn(async (_value: unknown) => undefined),
  deleteFavorite: vi.fn(async () => undefined),
}));

vi.mock('../../server/firebaseToken.js', () => ({
  verifyFirebaseIdToken: vi.fn(async () => ({ uid: mocks.uid })),
  FirebaseTokenError: class FirebaseTokenError extends Error {
    constructor(readonly status: 401 | 503, message: string) { super(message); }
  },
}));

vi.mock('../../server/firebaseAdmin.js', () => ({
  getFirebaseAdminApp: vi.fn(() => ({ name: 'test-app' })),
  FirebaseConfigurationError: class FirebaseConfigurationError extends Error {},
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: vi.fn(() => ({ type: 'serverTimestamp' })) },
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        collection: vi.fn(() => ({
          get: mocks.getFavorites,
          doc: vi.fn((id: string) => ({
            id,
            set: mocks.setFavorite,
            delete: mocks.deleteFavorite,
          })),
        })),
      })),
    })),
  })),
}));

function createRequest(method: string, body?: unknown, authorization = 'Bearer test-token'): VercelRequest {
  return {
    method,
    headers: authorization ? { authorization } : {},
    body,
  } as unknown as VercelRequest;
}

function createResponse() {
  let statusCode = 200;
  let jsonPayload: Record<string, unknown> = {};
  const headers: Record<string, string> = {};
  const response = {
    setHeader(name: string, value: string) {
      headers[name] = value;
      return response;
    },
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
    get headers() { return headers; },
  };
  return response as unknown as VercelResponse & typeof response;
}

describe('/api/favorites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = 'customer-1';
    mocks.documents = [];
    mocks.getFavorites.mockImplementation(async () => ({ docs: mocks.documents }));
  });

  it('lists only valid favorites for the authenticated user in most-recent-first order', async () => {
    mocks.documents = [
      { id: 'older', data: () => ({ productId: 'older', createdAt: { toMillis: () => 10 } }) },
      { id: 'newer', data: () => ({ productId: 'newer', createdAt: { toMillis: () => 20 } }) },
      { id: 'invalid', data: () => ({ productId: 'someone-else', createdAt: { toMillis: () => 30 } }) },
    ];
    const handler = (await import('../../api/favorites')).default;
    const response = createResponse();

    await handler(createRequest('GET'), response);

    expect(response.statusCode).toBe(200);
    expect(response.jsonPayload).toEqual({ success: true, data: { favoriteIds: ['newer', 'older'] } });
  });

  it('rejects a caller-supplied UID instead of allowing a cross-user write', async () => {
    const handler = (await import('../../api/favorites')).default;
    const response = createResponse();

    await handler(createRequest('POST', { productId: 'product-1', uid: 'admin-1' }), response);

    expect(response.statusCode).toBe(400);
    expect(mocks.setFavorite).not.toHaveBeenCalled();
  });

  it('creates and removes a favorite using the authenticated user's path', async () => {
    const handler = (await import('../../api/favorites')).default;
    const addResponse = createResponse();
    await handler(createRequest('POST', { productId: 'product-1' }), addResponse);

    expect(addResponse.statusCode).toBe(200);
    expect(mocks.setFavorite).toHaveBeenCalledWith({
      productId: 'product-1',
      createdAt: { type: 'serverTimestamp' },
    });

    const removeResponse = createResponse();
    await handler(createRequest('DELETE', { productId: 'product-1' }), removeResponse);
    expect(removeResponse.statusCode).toBe(200);
    expect(mocks.deleteFavorite).toHaveBeenCalledTimes(1);
  });

  it('rejects missing tokens, unsupported methods and malformed product ids', async () => {
    const handler = (await import('../../api/favorites')).default;
    const missingToken = createResponse();
    await handler(createRequest('GET', undefined, ''), missingToken);
    expect(missingToken.statusCode).toBe(401);

    const badMethod = createResponse();
    await handler(createRequest('PUT'), badMethod);
    expect(badMethod.statusCode).toBe(405);
    expect(badMethod.headers.Allow).toBe('GET, POST, DELETE');

    const invalidId = createResponse();
    await handler(createRequest('POST', { productId: '../other' }), invalidId);
    expect(invalidId.statusCode).toBe(400);
    expect(mocks.setFavorite).not.toHaveBeenCalled();
  });
});
