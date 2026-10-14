import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { auditService } from '@/services/auditService';
import type { AuditEntry } from '@/services/auditService';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

export function AuditLogPage() {
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<ServiceError | null>(null);
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchLogs = async () => {
      setStatus('loading');
      setError(null);
      try {
        const entries = await auditService.fetchRecentEntries();
        if (isMounted) {
          setLogs(entries);
          setStatus('success');
        }
      } catch (e) {
        if (!isMounted) return;
        setError({
          code: 'INTERNAL_ERROR',
          message: e instanceof Error ? e.message : 'Error al cargar registros de auditoría',
        });
        setStatus('error');
      }
    };

    void fetchLogs();
    return () => { isMounted = false; };
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
                      {log.timestamp > 0 ? new Date(log.timestamp).toLocaleString('es-AR') : '—'}
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
