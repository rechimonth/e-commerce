import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Price } from '@/components/ui/Price';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useCheckout';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { PAYMENT_METHODS } from '@/types/order';
import { SPAIN_PROVINCES } from '@/constants/checkout';

const PAYMENT_LABELS: Record<string, string> = {
  card: 'Tarjeta',
  paypal: 'PayPal',
  cash: 'Contra reembolso',
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const { user } = useAuth();
  const { isProcessing, processCheckout, error: checkoutError } = useCheckout();

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'España',
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'España',
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [notes, setNotes] = useState('');

  const handleShippingChange = (field: string, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
    if (billingSameAsShipping) {
      setBillingAddress((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleBillingChange = (field: string, value: string) => {
    setBillingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentMethod(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }
    if (items.length === 0) return;

    const cartState = {
      items,
      discount: { amount: 0, currency: 'USD' as const },
      totalItems,
      totalPrice,
      lastUpdated: new Date(),
    };

    try {
      const createdOrder = await processCheckout(
        {
          shippingAddress,
          billingAddress: billingSameAsShipping ? shippingAddress : billingAddress,
          paymentMethod: paymentMethod as 'card' | 'paypal' | 'cash',
          notes,
        },
        cartState,
        user.uid,
      );
      if (!createdOrder) return;
      clearCart();
      navigate(ROUTES.ORDERS);
    } catch {
      // useCheckout conserva el error visible y el carrito intacto.
    }
  };

  return (
    <>
      <Header />
      <Container as="main" className="py-8">
        <div className="mb-6 flex items-center gap-2">
          <Link to={ROUTES.CART} className="text-neutral-600 hover:text-neutral-900">
            Carrito
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-900">Checkout</span>
        </div>

        {items.length === 0 ? (
          <EmptyState
            config={{
              title: 'Tu carrito está vacío',
              description: 'Agrega productos antes de proceder al pago.',
              actionLabel: 'Ver catálogo',
              actionHref: ROUTES.CATALOG,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Información de envío</h2>
                  <div className="mt-4 space-y-4">
                    <Input
                      label="Calle"
                      value={shippingAddress.street}
                      onChange={(e) => handleShippingChange('street', e.target.value)}
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Ciudad"
                        value={shippingAddress.city}
                        onChange={(e) => handleShippingChange('city', e.target.value)}
                        required
                      />
                      <Select
                        label="Provincia"
                        options={SPAIN_PROVINCES}
                        value={shippingAddress.state}
                        onChange={(e) => handleShippingChange('state', e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Código postal"
                        value={shippingAddress.zipCode}
                        onChange={(e) => handleShippingChange('zipCode', e.target.value)}
                        required
                      />
                      <Input
                        label="País"
                        value={shippingAddress.country}
                        onChange={(e) => handleShippingChange('country', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="billing-same"
                      checked={billingSameAsShipping}
                      onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    />
                    <label htmlFor="billing-same" className="text-sm text-neutral-700">
                      La facturación es igual al envío
                    </label>
                  </div>

                  {!billingSameAsShipping && (
                    <div className="mt-4 space-y-4">
                      <h3 className="text-sm font-medium text-neutral-900">Información de facturación</h3>
                      <Input
                        label="Calle"
                        value={billingAddress.street}
                        onChange={(e) => handleBillingChange('street', e.target.value)}
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Ciudad"
                          value={billingAddress.city}
                          onChange={(e) => handleBillingChange('city', e.target.value)}
                          required
                        />
                        <Select
                          label="Provincia"
                          options={SPAIN_PROVINCES}
                          value={billingAddress.state}
                          onChange={(e) => handleBillingChange('state', e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Código postal"
                          value={billingAddress.zipCode}
                          onChange={(e) => handleBillingChange('zipCode', e.target.value)}
                          required
                        />
                        <Input
                          label="País"
                          value={billingAddress.country}
                          onChange={(e) => handleBillingChange('country', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700">Método de pago</label>
                  <Select
                    options={PAYMENT_METHODS.map((method) => ({
                      value: method,
                      label: PAYMENT_LABELS[method] ?? method,
                    }))}
                    value={paymentMethod}
                    onChange={handlePaymentMethodChange}
                  />
                </div>

                <div>
                  <Textarea
                    label="Notas (opcional)"
                    placeholder="Instrucciones especiales para la entrega..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {checkoutError && (
                  <p className="text-sm text-error-500">{checkoutError.message}</p>
                )}

                <Button
                  type="submit"
                  variant="solid"
                  size="lg"
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Procesando...' : `Pagar `}
                  {!isProcessing && <Price amount={totalPrice} />}
                </Button>
              </form>
            </div>

            <div>
              <div className="rounded-lg border border-neutral-200 p-6">
                <h2 className="mb-4 text-lg font-semibold text-neutral-900">Resumen del pedido</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <img
                        src={item.image.url}
                        alt={item.image.alt}
                        className="h-12 w-12 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-neutral-500">x{item.quantity}</p>
                      </div>
                      <Price amount={item.price.amount * item.quantity} currency={item.price.currency} />
                    </div>
                  ))}
                </div>
                <div className="border-t border-neutral-200 pt-4 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Total</span>
                    <Price amount={totalPrice} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}

export default CheckoutPage;
