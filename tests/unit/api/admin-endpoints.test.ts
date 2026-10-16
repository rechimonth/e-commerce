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

const requireAdminMock = vi.mocked(requireAdmin);

function makeRequest(
  method = 'GET',
  query: Record<string, string> = {},
  authorization = 'Bearer valid-token',
  body?: unknown,
) {
  return {
    method,
    query,
    body,
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
}: {
  users?: Array<{ id: string; data: () => Record<string, unknown> }>;
} = {}) {
  const userQuery = {
    where: vi.fn(),
    limit: vi.fn(),
    get: vi.fn().mockResolvedValue({ docs: users }),
  };
  userQuery.where.mockReturnValue(userQuery);
  userQuery.limit.mockReturnValue(userQuery);

  const firestore = {
    collection: vi.fn(() => userQuery),
  };
  return { firestore, userQuery };
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

  it('returns supported roles once per normalized email for the selector', async () => {
    const { firestore, userQuery } = makeFirestore({
      users: [
        { id: 'customer-old', data: () => ({
          email: 'customer@ecommerce.com',
          displayName: 'Cliente duplicado antiguo',
          role: 'customer',
          createdAt: { toMillis: () => 1000 },
        }) },
        { id: 'admin-1', data: () => ({
          email: 'admin@ecommerce.com',
          displayName: 'Admin',
          role: 'admin',
          createdAt: { toMillis: () => 1500 },
        }) },
        { id: 'customer-new', data: () => ({
          email: ' CUSTOMER@ECOMMERCE.COM ',
          displayName: 'Cliente',
          role: 'customer',
          createdAt: { toMillis: () => 2000 },
        }) },
        { id: 'unsupported-1', data: () => ({
          email: 'unsupported@ecommerce.com',
          displayName: 'Unsupported',
          role: 'owner',
          createdAt: { toMillis: () => 3000 },
        }) },
      ],
    });
    requireAdminMock.mockResolvedValue({ uid: 'admin-1', firestore } as never);

    const response = makeResponse();
    await usersHandler(makeRequest('GET', { role: 'all', limit: '200' }), response);

    expect(response.statusCode).toBe(200);
    expect(userQuery.where).not.toHaveBeenCalled();
    expect(userQuery.limit).toHaveBeenCalledWith(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        count: 2,
        users: [
          { uid: 'customer-new', email: 'customer@ecommerce.com', role: 'customer' },
          { uid: 'admin-1', email: 'admin@ecommerce.com', role: 'admin' },
        ],
      },
    });
  });

  it('filters the user query when a single supported role is requested', async () => {
    const { firestore, userQuery } = makeFirestore({
      users: [{ id: 'customer-1', data: () => ({
        email: 'customer@ecommerce.com',
        displayName: 'Cliente',
        role: 'customer',
        createdAt: { toMillis: () => 1700000000000 },
      }) }],
    });
    requireAdminMock.mockResolvedValue({ uid: 'admin-1', firestore } as never);

    const response = makeResponse();
    await usersHandler(makeRequest('GET', { role: 'customer', limit: '200' }), response);

    expect(response.statusCode).toBe(200);
    expect(userQuery.where).toHaveBeenCalledWith('role', '==', 'customer');
    expect(response.body).toMatchObject({
      success: true,
      data: {
        users: [{ uid: 'customer-1', email: 'customer@ecommerce.com', role: 'customer' }],
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

  it('updates an administrator own profile through the trusted server boundary', async () => {
    const profile = {
      uid: 'admin-1',
      email: 'old-admin@ecommerce.com',
      displayName: 'Admin anterior',
      role: 'admin',
    };
    const userRef = {
      get: vi.fn().mockResolvedValue({ exists: true, data: () => profile }),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const collection = { doc: vi.fn(() => userRef) };
    const firestore = { collection: vi.fn(() => collection) };
    requireAdminMock.mockResolvedValue({ uid: 'admin-1', firestore } as never);

    const response = makeResponse();
    await usersHandler(makeRequest('PATCH', {}, 'Bearer valid-token', {
      uid: 'admin-1',
      displayName: 'Admin actualizado',
      email: 'NEW-ADMIN@ECOMMERCE.COM',
      role: 'admin',
    }), response);

    expect(response.statusCode).toBe(200);
    expect(userRef.update).toHaveBeenCalledWith({
      displayName: 'Admin actualizado',
      email: 'new-admin@ecommerce.com',
    });
    expect(response.body).toMatchObject({
      success: true,
      data: {
        uid: 'admin-1',
        displayName: 'Admin actualizado',
        email: 'new-admin@ecommerce.com',
        role: 'admin',
      },
    });
  });

  it('prevents an administrator from changing their own role', async () => {
    const profile = { uid: 'admin-1', email: 'admin@ecommerce.com', displayName: 'Admin', role: 'admin' };
    const userRef = {
      get: vi.fn().mockResolvedValue({ exists: true, data: () => profile }),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const collection = { doc: vi.fn(() => userRef) };
    const firestore = { collection: vi.fn(() => collection) };
    requireAdminMock.mockResolvedValue({ uid: 'admin-1', firestore } as never);

    const response = makeResponse();
    await usersHandler(makeRequest('PATCH', {}, 'Bearer valid-token', {
      uid: 'admin-1',
      displayName: 'Admin',
      email: 'admin@ecommerce.com',
      role: 'customer',
    }), response);

    expect(response.statusCode).toBe(403);
    expect(userRef.update).not.toHaveBeenCalled();
  });
});
