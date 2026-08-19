import { Link, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ordersService } from '@/services/ordersService';
import { ROUTES } from '@/constants/routes';
import type { Order } from '@/types/order';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';
import { useEffect, useState } from 'react';
import { resolveProductImage, handleProductImageError } from '@/utils/productImage';

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<ServiceError | null>(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    setStatus('loading');
    setError(null);

    const fetchOrder = async () => {
      try {
        const result = await ordersService.fetchOrder(id);
        if (controller.signal.aborted) return;
        if (result) {
          setOrder(result);
          setStatus('success');
        } else {
          setError({ code: 'NOT_FOUND', message: 'Pedido no encontrado' });
          setStatus('error');
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        const serviceError: ServiceError = {
          code: 'INTERNAL_ERROR',
          message: e instanceof Error ? e.message : 'Error al cargar el pedido',
        };
        setError(serviceError);
        setStatus('error');
      }
    };

    void fetchOrder();
    return () => controller.abort();
  }, [id]);

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
          <span className="text-neutral-900">Confirmación</span>
        </div>

        {isLoading && <LoadingState message="Cargando confirmación..." />}

        {status === 'error' && error && (
          <ErrorState
            message={error.message}
            onRetry={() => {
              if (id) {
                void ordersService.fetchOrder(id).then((result) => {
                  if (result) {
                    setOrder(result);
                    setStatus('success');
                  } else {
                    setError({ code: 'NOT_FOUND', message: 'Pedido no encontrado' });
                    setStatus('error');
                  }
                });
              }
            }}
          />
        )}

        {!isLoading && order && status === 'success' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-neutral-900">
                    ¡Pedido confirmado!
                  </h1>
                  <p className="text-sm text-neutral-600">
                    Gracias por tu compra. Tu pedido ha sido procesado correctamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Pedido #{order.id}</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {order.createdAt.toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="mt-6 space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4"
                  >
                    <img
                      src={resolveProductImage(item)}
                      alt={item.image.alt}
                      className="h-16 w-16 rounded object-cover"
                     onError={handleProductImageError} />
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

              <div className="border-t border-neutral-200 pt-4 mt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <Price amount={order.pricing.total.amount} currency={order.pricing.total.currency} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="solid" asChild>
                <Link to={ROUTES.ORDER_DETAIL(order.id)}>Ver detalle del pedido</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={ROUTES.CATALOG}>Seguir comprando</Link>
              </Button>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}

export default OrderConfirmationPage;
