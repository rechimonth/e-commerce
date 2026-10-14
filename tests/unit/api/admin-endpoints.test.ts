import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

vi.mock('../../../server/adminAuthorization.js', () => {
  class MockAdminAuthorizationError extends Error {
    constructor(readonly status: 401 | 403, message: string) {
      super(message);
    }
  }

  return {
    AdminAuthorizationError: MockAdminAuthorizationError,
    requireAdmin: vi.fn(),
    getAdminError: (error: unknown) => {
      if (error instanceof MockAdminAuthorizationError) {
        return { status: error.status, message: error.message };
      }
      return { status: 500, message: 'Unable to complete the administrator request' };
    },
  };
});

import { AdminAuthorizationError, requireAdmin } from '../../../server/adminAuthorization.js';
import usersHandler from '../../../api/admin/users.js';
import auditLogsHandler from '../../../api/admin/audit-logs.js';

const requireAdminMock = vi.mocked(requireAdmin);

function makeRequest(
  method = 'GET',
  query: Record<string, string> = {},
  authorization = 'Bearer valid-token',
) {
  return {
    method,
    query,
    headers: authorization ? { authorization } : {},
  } as unknown as VercelRequest;
}

function makeResponse() {
  const response = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return response as unknown as VercelResponse & { statusCode: number; body: unknown };
}

function makeFirestore({
  users = [],
  logs = [],
}: {
  users?: Array<{ id: string; data: () => Record<string, unknown> }>;
  logs?: Array<{ id: string; data: () => Record<string, unknown> }>;
} = {}) {
  const userQuery = {
    where: vi.fn(),
    limit: vi.fn(),
    get: vi.fn().mockResolvedValue({ docs: users }),
  };
  userQuery.where.mockReturnValue(userQuery);
  userQuery.limit.mockReturnValue(userQuery);

  const auditQuery = {
    orderBy: vi.fn(),
    limit: vi.fn(),
    get: vi.fn().mockResolvedValue({ docs: logs }),
  };
  auditQuery.orderBy.mockReturnValue(auditQuery);
  auditQuery.limit.mockReturnValue(auditQuery);

  const firestore = {
    collection: vi.fn((name: string) => name === 'users' ? userQuery : auditQuery),
  };
  return { firestore, userQuery, auditQuery };
}

describe('admin data APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects requests without an allowed HTTP method before querying data', async () => {
    const response = makeResponse();
    await usersHandler(makeRequest('POST'), response);
    expect(response.statusCode).toBe(405);
    expect(requireAdminMock).not.toHaveBeenCalled();
  });

  it('returns only customer profiles for the customer selector', async () => {
    const { firestore, userQuery } = makeFirestore({
      users: [{
        id: 'customer-1',
        data: () => ({
          email: 'customer@example.com',
          displayName: 'Cliente de prueba',
          role: 'customer',
          createdAt: { toMillis: () => 1700000000000 },
        }),
      }],
    });
    requireAdminMock.mockResolvedValue({ uid: 'admin-1', firestore } as never);

    const response = makeResponse();
    await usersHandler(makeRequest('GET', { role: 'customer', limit: '200' }), response);

    expect(response.statusCode).toBe(200);
    expect(userQuery.where).toHaveBeenCalledWith('role', '==', 'customer');
    expect(userQuery.limit).toHaveBeenCalledWith(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        users: [{
          uid: 'customer-1',
          email: 'customer@example.com',
          displayName: 'Cliente de prueba',
          role: 'customer',
          createdAt: 1700000000000,
        }],
        count: 1,
      },
    });
  });

  it('rejects invalid roles from an unprivileged caller', async () => {
    requireAdminMock.mockRejectedValue(new AdminAuthorizationError(403, 'Admin role required'));
    const response = makeResponse();

    await usersHandler(makeRequest('GET', { role: 'customer' }), response);

    expect(response.statusCode).toBe(403);
  });

  it('returns recent audit records from the protected endpoint', async () => {
    const { firestore, auditQuery } = makeFirestore({
      logs: [{
        id: 'audit-1',
        data: () => ({
          action: 'product.updated',
          user: 'admin-1',
          timestamp: { toMillis: () => 1700000000000 },
          details: 'Updated product',
        }),
      }],
    });
    requireAdminMock.mockResolvedValue({ uid: 'admin-1', firestore } as never);

    const response = makeResponse();
    await auditLogsHandler(makeRequest(), response);

    expect(response.statusCode).toBe(200);
    expect(auditQuery.orderBy).toHaveBeenCalledWith('timestamp', 'desc');
    expect(auditQuery.limit).toHaveBeenCalledWith(50);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        logs: [{
          id: 'audit-1',
          action: 'product.updated',
          user: 'admin-1',
          timestamp: 1700000000000,
          details: 'Updated product',
        }],
        count: 1,
      },
    });
  });

  it('does not return audit records when admin authorization fails', async () => {
    requireAdminMock.mockRejectedValue(new AdminAuthorizationError(401, 'Authentication required'));
    const response = makeResponse();

    await auditLogsHandler(makeRequest('GET', {}, ''), response);

    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchObject({ success: false });
  });
});
