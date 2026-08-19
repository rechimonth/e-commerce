import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { ROUTES } from '@/constants/routes';
import type { ServiceError } from '@/types/api';

export function CategoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    setName(id);
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const { getFirebaseDb } = await import('@/infrastructure/firebase/config');
      const { doc, setDoc, getDoc } = await import('firebase/firestore');
      const db = getFirebaseDb();
      
      const normalized = name.toLowerCase().replace(/\s+/g, '-');
      if (isEdit && id) {
        const docRef = doc(db, 'categories', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await setDoc(docRef, { ...(snap.data() as Record<string, unknown>), name: normalized }, { merge: true });
        }
      } else {
        await setDoc(doc(db, 'categories', normalized), { name: normalized, createdAt: new Date() });
      }
      setSuccess(true);
      setTimeout(() => navigate(ROUTES.ADMIN_CATEGORIES), 1000);
    } catch (e) {
      setError({ code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'Error al guardar categoría' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">{isEdit ? 'Editar categoría' : 'Nueva categoría'}</h1>
        <Link to={ROUTES.ADMIN_CATEGORIES}>
          <Button variant="outline" size="sm">Cancelar</Button>
        </Link>
      </div>

      {error && <Alert variant="error" title="Error" message={error.message} />}
      {success && <Alert variant="success" title="Éxito" message={isEdit ? 'Categoría actualizada' : 'Categoría creada'} />}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={saving}
          />
          <div className="flex justify-end gap-3">
            <Link to={ROUTES.ADMIN_CATEGORIES}>
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

export default CategoryFormPage;
