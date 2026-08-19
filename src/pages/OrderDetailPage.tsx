import { Link, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ordersService } from '@/services/ordersService';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import type { Order } from '@/types/order';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';
import { useEffect, useState } from 'react';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<ServiceError | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!order || !user) return;
    setIsCancelling(true);
    try {
      await ordersService.cancelOrder(order.id, user.uid);
      setRefreshKey((k) => k + 1);
    } catch {
      // error will be reflected on next fetch
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    const abort = new AbortController();

    const fetchOrder = async () => {
      setStatus('loading');
      setError(null);
      try {
        const result = await ordersService.fetchOrder(id);
        if (abort.signal.aborted) return;
        if (result) {
          setOrder(result);
          setStatus('success');
        } else {
          setOrder(null);
          setError({
            code: 'NOT_FOUND',
            message: 'Pedido no encontrado',
          });
          setStatus('error');
        }
      } catch (e) {
        if (abort.signal.aborted) return;
        const serviceError: ServiceError = {
          code: 'INTERNAL_ERROR',
          message: e instanceof Error ? e.message : 'Error al cargar el pedido',
        };
        setError(serviceError);
        setStatus('error');
      }
    };

    void fetchOrder();
    return () => abort.abort();
  }, [id, refreshKey]);

  const isLoading = status === 'loading' || status === 'idle';

  return (
    <>
      <Header />
      <Container as="main" className="py-8">
        <div className="mb-6 flex items-center gap-2">
          <Link to={ROUTES.ORDERS} className="text-neutral-600 hover:text-neutral-900">
            Mis órdenes
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-900">Detalle</span>
        </div>

        {isLoading && <LoadingState message="Cargando pedido..." />}

        {status === 'error' && error && (
          <ErrorState
            message={error.message}
            onRetry={() => setRefreshKey((k) => k + 1)}
          />
        )}

        {!isLoading && !order && status !== 'error' && (
          <EmptyState
            config={{
              title: 'Pedido no encontrado',
              description: 'No se encontró el pedido solicitado.',
              actionLabel: 'Ver todas mis órdenes',
              actionHref: ROUTES.ORDERS,
            }}
          />
        )}

        {order && status === 'success' && (
          <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-500">
                    Pedido #{order.id}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {order.createdAt.toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  {order.status === 'pending' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isCancelling}
                    >
                      {isCancelling ? 'Cancelando...' : 'Cancelar pedido'}
                    </Button>
                  )}
                </div>
              </div>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4"
                >
                  <img
                    src={item.image.url}
                    alt={item.image.alt}
                    className="h-16 w-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">{item.name}</p>
                    <p className="text-sm text-neutral-500">
                      <Price amount={item.price.amount} currency={item.price.currency} />
                      {' '}
                      x {item.quantity}
                    </p>
                  </div>
                  <Price
                    amount={item.price.amount * item.quantity}
                    currency={item.price.currency}
                  />
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-neutral-200 p-6">
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
                    <span className="text-neutral-600">Envío</span>
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

              <div className="mt-6 space-y-2">
                <p className="text-sm">
                  <span className="text-neutral-600">Método de pago:</span>{' '}
                  <span className="text-neutral-900">
                    {order.paymentMethod === 'card'
                      ? 'Tarjeta'
                      : order.paymentMethod === 'paypal'
                        ? 'PayPal'
                        : 'Contra reembolso'}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-neutral-600">Dirección de envío:</span>{' '}
                  <span className="text-neutral-900">
                    {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
                    {order.shippingAddress.state}
                  </span>
                </p>
                {order.notes && (
                  <p className="text-sm">
                    <span className="text-neutral-600">Notas:</span> {order.notes}
                  </p>
                )}
              </div>
              </div>

              {(order.trackingNumber || order.carrier || order.estimatedDelivery) && (
                <div className="rounded-lg border border-neutral-200 p-6">
                  <h2 className="mb-4 text-lg font-semibold text-neutral-900">Seguimiento de envío</h2>
                  <div className="space-y-2">
                    {order.trackingNumber && (
                      <p className="text-sm">
                        <span className="text-neutral-600">Número de seguimiento:</span>{' '}
                        <span className="text-neutral-900">{order.trackingNumber}</span>
                      </p>
                    )}
                    {order.carrier && (
                      <p className="text-sm">
                        <span className="text-neutral-600">Paquetería:</span>{' '}
                        <span className="text-neutral-900">{order.carrier}</span>
                      </p>
                    )}
                    {order.estimatedDelivery && (
                      <p className="text-sm">
                        <span className="text-neutral-600">Entrega estimada:</span>{' '}
                        <span className="text-neutral-900">
                          {order.estimatedDelivery.toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {order.attachments && order.attachments.length > 0 && (
                <div className="rounded-lg border border-neutral-200 p-6">
                  <h2 className="mb-4 text-lg font-semibold text-neutral-900">Archivos adjuntos</h2>
                  <div className="space-y-2">
                    {order.attachments.map((att) => (
                      <a
                        key={att.key}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-md border border-neutral-200 p-3 hover:bg-neutral-50"
                      >
                        <img src={att.url} alt={att.name} className="h-10 w-10 rounded object-cover" />
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{att.name}</p>
                          <p className="text-xs text-neutral-500">
                            {att.uploadedAt.toLocaleString('es-ES')}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="outline" asChild>
                <Link to={ROUTES.ORDERS}>Volver a mis órdenes</Link>
              </Button>
            </div>
          )}
      </Container>
    </>
  );
}

export default OrderDetailPage;
