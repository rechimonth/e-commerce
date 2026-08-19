import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ROUTES } from '@/constants/routes';
import type { UserProfile } from '@/types/auth';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

export function UsersPage() {
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<ServiceError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
      const { getFirebaseDb } = await import('@/infrastructure/firebase/config');
      const db = getFirebaseDb();
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const usersList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email ?? null,
          displayName: data.displayName ?? null,
          photoURL: data.photoURL ?? null,
          role: data.role ?? 'customer',
          createdAt: new Date(data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now()),
          lastLoginAt: new Date(data.lastLoginAt?.seconds ? data.lastLoginAt.seconds * 1000 : Date.now()),
          preferences: data.preferences ?? { currency: 'USD', locale: 'es', notifications: true },
        } as UserProfile;
      });
      setUsers(usersList);
      setStatus('success');
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al cargar usuarios',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setError(err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users?.filter((u) =>
    (u.displayName ?? u.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.uid.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  if (status === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === 'error' && error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-error-600">{error.message}</p>
        <button onClick={fetchUsers} className="mt-2 text-sm text-primary-600 hover:underline">
          Reintentar
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Usuarios</h1>
        <Link to={ROUTES.ADMIN_USER_NEW}>
          <Button variant="solid" size="md">
            Nuevo usuario
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <Input
          placeholder="Buscar por nombre, email o UID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-neutral-600">No se encontraron usuarios</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredUsers.map((user) => (
                  <tr key={user.uid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {user.displayName ?? 'Sin nombre'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {user.email ?? '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.role === 'admin' ? 'success' : 'default'}>
                        {user.role === 'admin' ? 'Admin' : 'Cliente'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link to={ROUTES.ADMIN_USER_EDIT(user.uid)}>
                        <Button variant="outline" size="sm">Editar</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default UsersPage;
