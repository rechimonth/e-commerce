import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Container } from '@/components/ui/Container';
import { Price } from '@/components/ui/Price';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { ordersService } from '@/services/ordersService';
import { resolveProductImage, handleProductImageError } from '@/utils/productImage';
import { ROUTES } from '@/constants/routes';
import type { Order } from '@/types/order';
import { useState } from 'react';

export function OrdersPage() {
  const { user } = useAuth();
  const userId = user?.uid ?? '';
  const { orders, status, error, isLoading, isEmpty, refetch } = useOrders(userId);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (order: Order) => {
    if (!user) return;
    setCancellingId(order.id);
    try {
      await ordersService.cancelOrder(order.id, user.uid);
      refetch();
    } catch {
      refetch();
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (order: Order) => order.status === 'pending';

  return (
    <>
      <Header />
      <Container as="main" className="py-8">
        <h1 className="mb-6 text-3xl font-bold text-neutral-900">Mis Órdenes</h1>

        {isLoading && <LoadingState message="Cargando órdenes..." />}

        {status === 'error' && error && (
          <ErrorState message={error.message} onRetry={refetch} />
        )}

        {!isLoading && status === 'success' && isEmpty && (
          <EmptyState
            config={{
              title: 'No tienes órdenes',
              description: 'Realiza tu primera compra para ver el historial.',
              actionLabel: 'Explorar catálogo',
              actionHref: ROUTES.CATALOG,
            }}
          />
        )}

        {!isLoading && status === 'success' && !isEmpty && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-neutral-200 p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">
                      Pedido #{order.id.slice(-8)}
                    </p>
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

                <div className="mt-4 flex items-center gap-4 overflow-x-auto">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.productId} className="flex min-w-[80px] flex-col items-center gap-2">
                      <img
                        src={resolveProductImage(item)}
                        alt={item.image.alt}
                        className="h-16 w-16 rounded object-cover"
                       onError={handleProductImageError} />
                      <span className="text-xs text-neutral-600">{item.name}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <span className="text-sm text-neutral-500">
                      +{order.items.length - 3} más
                    </span>
                  )}
                </div>

                <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4">
                  <span className="text-sm font-medium text-neutral-600">
                    {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                  </span>
                  <div className="flex items-center gap-4">
                    <Price amount={order.pricing.total.amount} currency={order.pricing.total.currency} />
                    <Link
                      to={ROUTES.ORDER_DETAIL(order.id)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Ver detalle
                    </Link>
                    {canCancel(order) && (
                      <button
                        type="button"
                        onClick={() => handleCancel(order)}
                        disabled={cancellingId === order.id}
                        className="text-sm font-medium text-error-600 hover:text-error-700 disabled:opacity-50"
                      >
                        {cancellingId === order.id ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}

export default OrdersPage;
