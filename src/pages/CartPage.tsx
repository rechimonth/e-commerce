import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { EmptyState } from '@/components/ui/EmptyState';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { useCart } from '@/hooks/useCart';
import { ROUTES } from '@/constants/routes';
import { EMPTY_STATES } from '@/types/ui';

export function CartPage() {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();

  return (
    <>
      <Header />
      <Container as="main" className="py-8">
        <div className="mb-6 flex items-center gap-2">
          <Link to={ROUTES.HOME} className="text-neutral-600 hover:text-neutral-900">
            Inicio
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-900">Carrito</span>
        </div>

        {items.length === 0 ? (
          <EmptyState config={EMPTY_STATES.cart} />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItemRow
                    key={item.productId}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
              <div className="mt-6">
                <Button variant="outline" onClick={clearCart}>
                  Vaciar carrito
                </Button>
              </div>
            </div>

            <div>
              <div className="rounded-lg border border-neutral-200 p-6">
                <h2 className="mb-4 text-lg font-semibold text-neutral-900">Resumen</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Subtotal</span>
                    <Price amount={totalPrice} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Elementos</span>
                    <span className="text-neutral-900">{totalItems}</span>
                  </div>
                  <div className="border-t border-neutral-200 pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <Price amount={totalPrice} />
                    </div>
                  </div>
                </div>
              </div>

              <Button variant="solid" size="lg" className="mt-6 w-full" asChild>
                <Link to={ROUTES.CHECKOUT}>Proceder al pago</Link>
              </Button>

              <Button variant="outline" size="md" className="mt-3 w-full" asChild>
                <Link to={ROUTES.CATALOG}>Continuar comprando</Link>
              </Button>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}

export default CartPage;
