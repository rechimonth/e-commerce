import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mocks = vi.hoisted(() => ({
  missingIds: new Set<string>(),
  deleted: vi.fn(),
}));

vi.mock('../../../server/adminAuthorization.js', () => ({
  requireAdmin: vi.fn(async () => ({
    uid: 'admin-1',
    firestore: {
      collection: vi.fn((collectionName: string) => ({
        doc: vi.fn((id: string) => ({ id, collectionName })),
      })),
      runTransaction: vi.fn(async (
        callback: (transaction: {
          get: (ref: { id: string }) => Promise<{ exists: boolean }>;
          delete: (ref: unknown) => void;
        }) => Promise<unknown>,
      ) => callback({
        get: async (ref) => ({ exists: !mocks.missingIds.has(ref.id) }),
        delete: mocks.deleted,
      })),
    },
  })),
  getAdminError: vi.fn(() => ({ status: 500, message: 'Unexpected admin request failure' })),
}));

function createRequest(body: Record<string, unknown>, method = 'POST'): VercelRequest {
  return {
    method,
    headers: { authorization: 'Bearer test-token' },
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

describe('POST /api/admin/delete-orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.missingIds.clear();
  });

  it('deletes existing orders transactionally for an authenticated admin', async () => {
    const handler = (await import('../../../api/admin/delete-orders')).default;
    const response = createResponse();

    await handler(createRequest({ orderIds: ['order-1', 'order-2'] }), response);

    expect(response.statusCode).toBe(200);
    expect(response.jsonPayload).toEqual({ success: true, deletedOrderIds: ['order-1', 'order-2'] });
    expect(mocks.deleted).toHaveBeenCalledTimes(2);
    expect(mocks.deleted).toHaveBeenNthCalledWith(1, { id: 'order-1', collectionName: 'orders' });
  });

  it('does not delete any order when any requested id is missing', async () => {
    mocks.missingIds.add('missing-order');
    const handler = (await import('../../../api/admin/delete-orders')).default;
    const response = createResponse();

    await handler(createRequest({ orderIds: ['order-1', 'missing-order'] }), response);

    expect(response.statusCode).toBe(404);
    expect(mocks.deleted).not.toHaveBeenCalled();
  });

  it('rejects unsupported HTTP methods with an Allow header', async () => {
    const handler = (await import('../../../api/admin/delete-orders')).default;
    const response = createResponse();

    await handler(createRequest({ orderIds: ['order-1'] }, 'DELETE'), response);

    expect(response.statusCode).toBe(405);
    expect(response.headers.Allow).toBe('POST');
    expect(mocks.deleted).not.toHaveBeenCalled();
  });

  it('rejects empty and malformed deletion requests', async () => {
    const handler = (await import('../../../api/admin/delete-orders')).default;
    const response = createResponse();

    await handler(createRequest({ orderIds: [] }), response);

    expect(response.statusCode).toBe(400);
    expect(mocks.deleted).not.toHaveBeenCalled();
  });
});
