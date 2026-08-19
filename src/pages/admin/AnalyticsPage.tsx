import { Card } from '@/components/ui/Card';
import { Price } from '@/components/ui/Price';
import { dashboardService } from '@/services/dashboardService';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';
import type { DashboardStats } from '@/types/admin';
import type { CurrencyCode } from '@/types/pricing';
import { Skeleton } from '@/components/ui/Skeleton';
import { useState, useEffect } from 'react';

export function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<ServiceError | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setStatus('loading');
      setError(null);
      try {
        const data = await dashboardService.getStats();
        setStats(data);
        setStatus('success');
      } catch (e) {
        setError({ code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'Error al cargar analytics' });
        setStatus('error');
      }
    };
    void fetchStats();
  }, []);

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-neutral-900">Analytics</h1>
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

  if (!stats) return null;

  const maxStatusCount = Math.max(
    stats.orderStatusCounts.pending,
    stats.orderStatusCounts.processing,
    stats.orderStatusCounts.completed,
    stats.orderStatusCounts.cancelled,
    1,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-900">Analytics</h1>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Resumen</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 p-4 text-center">
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
            <p className="text-sm text-neutral-500">Productos</p>
          </div>
          <div className="rounded-lg border border-neutral-200 p-4 text-center">
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
            <p className="text-sm text-neutral-500">Órdenes</p>
          </div>
          <div className="rounded-lg border border-neutral-200 p-4 text-center">
            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
            <p className="text-sm text-neutral-500">Pendientes</p>
          </div>
          <div className="rounded-lg border border-neutral-200 p-4 text-center">
            <p className="text-2xl font-bold">{stats.completedOrders}</p>
            <p className="text-sm text-neutral-500">Completadas</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Ingresos totales</h2>
        <Price amount={stats.totalRevenue.amount} currency={stats.totalRevenue.currency} />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Distribución de órdenes</h2>
        <div className="space-y-3">
          {[
            { label: 'Pendiente', count: stats.orderStatusCounts.pending, color: 'bg-warning-500' },
            { label: 'Procesando', count: stats.orderStatusCounts.processing, color: 'bg-neutral-400' },
            { label: 'Completado', count: stats.orderStatusCounts.completed, color: 'bg-success-500' },
            { label: 'Cancelado', count: stats.orderStatusCounts.cancelled, color: 'bg-error-500' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="w-24 text-sm text-neutral-600">{item.label}</span>
              <div className="flex-1 rounded-full bg-neutral-100 h-4 overflow-hidden">
                <div
                  className={`h-full ${item.color}`}
                  style={{ width: `${(item.count / maxStatusCount) * 100}%` }}
                />
              </div>
              <span className="w-8 text-sm text-neutral-600">{item.count}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Órdenes recientes</h2>
        {stats.recentOrders.length === 0 ? (
          <p className="text-neutral-500">No hay órdenes recientes</p>
        ) : (
          <div className="space-y-2">
            {stats.recentOrders.map((order: { id: string; userId: string; total: { amount: number; currency: CurrencyCode } }) => (
              <div key={order.id} className="flex items-center justify-between rounded-md border border-neutral-200 p-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">#{order.id.slice(-8)}</p>
                  <p className="text-xs text-neutral-500">{order.userId}</p>
                </div>
                <Price amount={order.total.amount} currency={order.total.currency} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default AnalyticsPage;
