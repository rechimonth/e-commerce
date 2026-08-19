import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import type { ServiceError } from '@/types/api';

export function SettingsPage() {
  const [storeName, setStoreName] = useState('Mi Tienda');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const { getFirebaseDb } = await import('@/infrastructure/firebase/config');
      const { doc, setDoc } = await import('firebase/firestore');
      const db = getFirebaseDb();
      await setDoc(doc(db, 'settings', 'store'), { name: storeName, updatedAt: new Date() }, { merge: true });
      setSuccess(true);
    } catch (e) {
      setError({ code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'Error al guardar configuración' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-900">Configuración</h1>

      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <h2 className="text-lg font-semibold text-neutral-900">Tienda</h2>
          {error && <Alert variant="error" title="Error" message={error.message} />}
          {success && <Alert variant="success" title="Éxito" message="Configuración guardada" />}
          <Input
            label="Nombre de la tienda"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
            disabled={saving}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="solid" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default SettingsPage;
