import { adminGet } from '@/services/adminApi';

export interface AdminUserSummary {
  readonly uid: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly photoURL: string | null;
  readonly role: 'admin' | 'customer';
  readonly createdAt: number;
  readonly lastLoginAt: number;
}

export interface CustomerSummary {
  readonly uid: string;
  readonly displayName: string;
  readonly email: string;
}

interface UserListResponse {
  readonly users: AdminUserSummary[];
  readonly count: number;
}

export const usersService = {
  async fetchUsers(): Promise<AdminUserSummary[]> {
    const result = await adminGet<UserListResponse>('/api/admin/users?role=all&limit=100');
    return result.users;
  },

  async fetchCustomers(): Promise<CustomerSummary[]> {
    const result = await adminGet<UserListResponse>('/api/admin/users?role=customer&limit=200');
    return result.users.map((profile) => ({
      uid: profile.uid,
      displayName: profile.displayName?.trim() || 'Cliente sin nombre',
      email: profile.email ?? '',
    }));
  },
};
