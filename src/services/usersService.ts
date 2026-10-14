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

export interface OrderRecipientSummary {
  readonly uid: string;
  readonly displayName: string;
  readonly email: string;
  readonly role: 'admin' | 'customer';
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

  async fetchOrderRecipients(): Promise<OrderRecipientSummary[]> {
    const result = await adminGet<UserListResponse>('/api/admin/users?role=all&limit=200');
    const profilesByEmail = new Map<string, AdminUserSummary>();

    for (const profile of result.users) {
      if (profile.role !== 'admin' && profile.role !== 'customer') continue;
      const email = profile.email?.trim().toLowerCase();
      if (!email) continue;

      const current = profilesByEmail.get(email);
      if (!current || profile.createdAt > current.createdAt) {
        profilesByEmail.set(email, { ...profile, email });
      }
    }

    return [...profilesByEmail.values()]
      .sort((a, b) => {
        if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
        return (a.email ?? '').localeCompare(b.email ?? '');
      })
      .map((profile) => ({
        uid: profile.uid,
        displayName: profile.displayName?.trim()
          || (profile.role === 'admin' ? 'Administrador sin nombre' : 'Cliente sin nombre'),
        email: profile.email!,
        role: profile.role,
      }));
  },
};
