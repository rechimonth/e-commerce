import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { Price } from '@/components/ui/Price';
import { ordersService } from '@/services/ordersService';
import { VALID_ORDER_TRANSITIONS, type OrderStatus, type Order } from '@/types/order';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<ServiceError | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setStatus('loading');
    setError(null);
    try {
      const result = await ordersService.fetchOrder(id);
      if (result) {
        setOrder(result);
        setStatus('success');
      } else {
        setError({ code: 'NOT_FOUND', message: 'Orden no encontrada' });
        setStatus('error');
      }
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al cargar orden',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setError(err);
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      if (!user) throw new Error('Usuario administrador no autenticado');
      const updated = await ordersService.updateOrderStatus(order.id, newStatus, user.uid);
      if (updated) {
        setOrder(updated);
      }
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : 'Error al actualizar estado');
    } finally {
      setIsUpdating(false);
    }
  };

  const getAvailableTransitions = (current: OrderStatus): OrderStatus[] => {
    return VALID_ORDER_TRANSITIONS[current] as OrderStatus[];
  };

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === 'error' && error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-neutral-600">{error.message}</p>
        <Link to="/admin/orders">
          <Button variant="outline" className="mt-4">
            Volver a órdenes
          </Button>
        </Link>
      </Card>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">
          Orden #{order.id.slice(-8)}
        </h1>
        <Link to="/admin/orders">
          <Button variant="outline" size="sm">
            Volver a órdenes
          </Button>
        </Link>
      </div>

      {updateError && <Alert variant="error" title="Error" message={updateError} />}

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <OrderStatusBadge status={order.status} />
            <p className="mt-2 text-sm text-neutral-500">
              Creada: {order.createdAt.toLocaleString('es-ES')}
            </p>
            <p className="text-sm text-neutral-500">
              Actualizada: {order.updatedAt.toLocaleString('es-ES')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value=""
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              disabled={isUpdating || getAvailableTransitions(order.status).length === 0}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="" disabled>
                Cambiar estado
              </option>
              {getAvailableTransitions(order.status).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {isUpdating && <span className="text-xs text-neutral-500">Actualizando...</span>}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Productos</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-4">
              <img
                src={item.image.url}
                alt={item.image.alt}
                className="h-12 w-12 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-neutral-900">{item.name}</p>
                <p className="text-sm text-neutral-500">{item.quantity} x</p>
              </div>
              <Price
                amount={item.price.amount * item.quantity}
                currency={item.price.currency}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Informaciónón de envío</h2>
        <div className="space-y-2">
          <p className="text-sm text-neutral-600">{order.shippingAddress.street}</p>
          <p className="text-sm text-neutral-600">
            {order.shippingAddress.city}, {order.shippingAddress.state}
          </p>
          <p className="text-sm text-neutral-600">
            {order.shippingAddress.zipCode} - {order.shippingAddress.country}
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Pago</h2>
        <p className="text-sm text-neutral-600">Método: {order.paymentMethod}</p>
        {order.notes && <p className="mt-2 text-sm text-neutral-600">Notas: {order.notes}</p>}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Resumen financiero</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Subtotal</span>
            <Price amount={order.pricing.subtotal.amount} currency={order.pricing.subtotal.currency} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Impuestos</span>
            <Price amount={order.pricing.tax.amount} currency={order.pricing.tax.currency} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Envíoío</span>
            <Price amount={order.pricing.shipping.amount} currency={order.pricing.shipping.currency} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Descuento</span>
            <Price amount={order.pricing.discount.amount} currency={order.pricing.discount.currency} />
          </div>
          <div className="border-t border-neutral-200 pt-2">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <Price amount={order.pricing.total.amount} currency={order.pricing.total.currency} />
            </div>
          </div>
        </div>
      </Card>

      {order.statusHistory.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Historial de estados</h2>
          <div className="space-y-3">
            {order.statusHistory.map((entry, i) => (
              <div key={i} className="border-l-2 border-neutral-200 pl-3 pb-2">
                <p className="text-sm">
                  <span className="font-medium">{entry.from}</span> →{' '}
                  <span className="font-medium">{entry.to}</span>
                </p>
                <p className="text-xs text-neutral-500">
                  Por: {entry.by} • {entry.timestamp.toLocaleString('es-ES')}
                </p>
                {entry.reason && <p className="text-xs text-neutral-500">Razónón: {entry.reason}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default AdminOrderDetailPage;
