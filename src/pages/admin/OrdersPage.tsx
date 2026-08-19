import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Price } from '@/components/ui/Price';
import { ordersService } from '@/services/ordersService';
import { canTransition } from '@/types/order';
import type { Order, OrderStatus } from '@/types/order';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

type StatusFilter = 'all' | OrderStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'processing', label: 'Procesando' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<ServiceError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusSelectValue, setStatusSelectValue] = useState<string>('');

  const fetchOrders = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const filters = statusFilter === 'all' ? undefined : { status: statusFilter };
      const result = await ordersService.fetchAllOrders(filters);
      setOrders(result);
      setStatus('success');
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al cargar órdenes',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setError(err);
      setStatus('error');
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      if (!user) throw new Error('Usuario administrador no autenticado');
      const updated = await ordersService.updateOrderStatus(orderId, newStatus, user.uid);
      if (updated) {
        setOrders((prev) =>
          prev ? prev.map((o) => (o.id === orderId ? updated : o)) : prev,
        );
        setStatusSelectValue("");
      } else {
        void fetchOrders();
      }
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al actualizar estado',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setError(err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) ?? [];

  const getAvailableStatusTransitions = (current: OrderStatus): OrderStatus[] => {
    return (['pending', 'processing', 'completed', 'cancelled'] as const)
      .filter((status) => canTransition(current, status));
  };

  if (status === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === 'error' && error) {
    return <ErrorState message={error.message} onRetry={fetchOrders} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-900">Órdenes</h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full max-w-md">
          <Input
            placeholder="Buscar por ID o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-neutral-600">No se encontraron órdenes</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      #{order.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {order.userId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {order.createdAt.toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Price amount={order.pricing.total.amount} currency={order.pricing.total.currency} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={statusSelectValue}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          disabled={updatingOrderId === order.id || getAvailableStatusTransitions(order.status).length === 0}
                          className="text-sm"
                        >
                          <option value="" disabled>
                            Cambiar estado
                          </option>
                          {getAvailableStatusTransitions(order.status).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <Link to={`/admin/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            Ver detalle
                          </Button>
                        </Link>
                      </div>
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

export default AdminOrdersPage;
