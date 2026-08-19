import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

export function UploadsPage() {
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<ServiceError | null>(null);
  const [uploads, setUploads] = useState<Array<{ key: string; url: string }>>([]);

  useEffect(() => {
    const fetchUploads = async () => {
      setStatus('loading');
      setError(null);
      try {
        const { getFirebaseDb } = await import('@/infrastructure/firebase/config');
        const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
        const db = getFirebaseDb();
        const q = query(collection(db, 'uploads'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          return {
            key: doc.id,
            url: (data.url as string) ?? '',
          };
        });
        setUploads(items);
        setStatus('success');
      } catch (e) {
        setError({ code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'Error al cargar archivos' });
        setStatus('error');
      }
    };
    void fetchUploads();
  }, []);

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
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-900">Media</h1>
      {uploads.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-neutral-600">No hay archivos subidos</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Vista previa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Clave S3</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {uploads.map((upload) => (
                  <tr key={upload.key}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img src={upload.url} alt="Upload" className="h-10 w-10 rounded object-cover" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{upload.key}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(upload.url)}>Copiar URL</Button>
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

export default UploadsPage;
