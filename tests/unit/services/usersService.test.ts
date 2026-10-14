import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminUserSummary } from '@/services/usersService';

vi.mock('@/services/adminApi', () => ({
  adminGet: vi.fn(),
}));

import { adminGet } from '@/services/adminApi';
import { usersService } from '@/services/usersService';

const adminGetMock = vi.mocked(adminGet);

function user(
  uid: string,
  email: string | null,
  role: 'admin' | 'customer',
  displayName: string | null,
  createdAt: number,
): AdminUserSummary {
  return {
    uid,
    email,
    role,
    displayName,
    photoURL: null,
    createdAt,
    lastLoginAt: 0,
  };
}

describe('usersService.fetchOrderRecipients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns admin and customer once each, deduplicated by normalized email', async () => {
    adminGetMock.mockResolvedValue({
      users: [
        user('customer-old', 'customer@ecommerce.com', 'customer', 'Cliente viejo', 100),
        user('admin-1', 'admin@ecommerce.com', 'admin', 'Admin', 200),
        user('customer-1', ' CUSTOMER@ECOMMERCE.COM ', 'customer', 'Cliente', 300),
        user('no-email', null, 'customer', 'Sin correo', 400),
      ],
      count: 4,
    } as never);

    const recipients = await usersService.fetchOrderRecipients();

    expect(adminGetMock).toHaveBeenCalledWith('/api/admin/users?role=all&limit=200');
    expect(recipients).toEqual([
      { uid: 'admin-1', email: 'admin@ecommerce.com', displayName: 'Admin', role: 'admin' },
      { uid: 'customer-1', email: 'customer@ecommerce.com', displayName: 'Cliente', role: 'customer' },
    ]);
  });
});
