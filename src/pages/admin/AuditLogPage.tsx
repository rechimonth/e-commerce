import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

interface AuditEntry {
  readonly id: string;
  readonly action: string;
  readonly user: string;
  readonly timestamp: Date;
  readonly details: string;
}

export function AuditLogPage() {
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<ServiceError | null>(null);
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      setStatus('loading');
      setError(null);
      try {
        const { getFirebaseDb } = await import('@/infrastructure/firebase/config');
        const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
        const db = getFirebaseDb();
        const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        const entries = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            action: data.action ?? 'unknown',
            user: data.user ?? 'system',
            timestamp: new Date(data.timestamp?.seconds ? data.timestamp.seconds * 1000 : Date.now()),
            details: data.details ?? '',
          } as AuditEntry;
        });
        setLogs(entries);
        setStatus('success');
      } catch (e) {
        setError({ code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'Error al cargar logs' });
        setStatus('error');
      }
    };
    void fetchLogs();
  }, []);

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-neutral-900">Auditoría</h1>
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
      <h1 className="text-3xl font-bold text-neutral-900">Auditoría</h1>
      {logs.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-neutral-600">No hay registros de auditoría</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Acción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{log.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{log.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {log.timestamp.toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{log.details}</td>
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

export default AuditLogPage;
