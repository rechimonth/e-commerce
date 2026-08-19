import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { ROUTES } from '@/constants/routes';
import { USER_ROLES } from '@/types/auth';
import type { UserProfile } from '@/types/auth';
import type { ServiceError } from '@/types/api';

export function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    role: 'customer' as UserProfile['role'],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const { getFirebaseDb } = await import('@/infrastructure/firebase/config');
        const { doc, getDoc } = await import('firebase/firestore');
        const db = getFirebaseDb();
        const docSnap = await getDoc(doc(db, 'users', id));
        if (docSnap.exists()) {
          const data = docSnap.data() as Record<string, unknown>;
          setForm({
            displayName: (data.displayName as string) ?? '',
            email: (data.email as string) ?? '',
            role: (data.role as UserProfile['role']) ?? 'customer',
          });
        }
      } catch (e) {
        setError({ code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'Error al cargar usuario' });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const { getFirebaseDb } = await import('@/infrastructure/firebase/config');
      const { doc, setDoc } = await import('firebase/firestore');
      const db = getFirebaseDb();
      if (isEdit && id) {
        await setDoc(doc(db, 'users', id), { ...form, uid: id }, { merge: true });
      } else {
        const newId = crypto.randomUUID();
        await setDoc(doc(db, 'users', newId), { ...form, uid: newId, role: form.role, createdAt: new Date(), lastLoginAt: new Date(), preferences: { currency: 'USD', locale: 'es', notifications: true } });
      }
      setSuccess(true);
      setTimeout(() => navigate(ROUTES.ADMIN_USERS), 1000);
    } catch (e) {
      setError({ code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'Error al guardar usuario' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h1>
        <Link to={ROUTES.ADMIN_USERS}>
          <Button variant="outline" size="sm">Cancelar</Button>
        </Link>
      </div>

      {error && <Alert variant="error" title="Error" message={error.message} />}
      {success && <Alert variant="success" title="Éxito" message={isEdit ? 'Usuario actualizado' : 'Usuario creado'} />}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nombre"
            value={form.displayName}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            required
            disabled={saving}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
            disabled={saving}
          />
          <Select
            label="Rol"
            options={USER_ROLES.map((role) => ({ value: role, label: role === 'admin' ? 'Admin' : 'Cliente' }))}
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserProfile['role'] }))}
            disabled={saving}
          />
          <div className="flex justify-end gap-3">
            <Link to={ROUTES.ADMIN_USERS}>
              <Button variant="outline" type="button" disabled={saving}>Cancelar</Button>
            </Link>
            <Button type="submit" variant="solid" disabled={saving}>
              {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default UserFormPage;
