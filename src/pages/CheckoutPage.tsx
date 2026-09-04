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
import { resolveProductImage, handleProductImageError } from '@/utils/productImage';
import { useCheckout } from '@/hooks/useCheckout';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { PAYMENT_METHODS } from '@/types/order';

const PAYMENT_LABELS: Record<string, string> = { card: 'Tarjeta', paypal: 'PayPal', cash: 'Contra reembolso' };

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const { user } = useAuth();
  const { isProcessing, processCheckout, error: checkoutError } = useCheckout();
  const [shippingAddress, setShippingAddress] = useState({ street: '', city: '', state: '', zipCode: '', country: '' });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState({ street: '', city: '', state: '', zipCode: '', country: '' });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [notes, setNotes] = useState('');

  const handleShippingChange = (field: string, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
    if (billingSameAsShipping) setBillingAddress((prev) => ({ ...prev, [field]: value }));
  };
  const handleBillingChange = (field: string, value: string) => setBillingAddress((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate(ROUTES.LOGIN); return; }
    if (items.length === 0) return;
    const cartState = { items, discount: { amount: 0, currency: 'USD' as const }, totalItems, totalPrice, lastUpdated: new Date() };
    try {
      const createdOrder = await processCheckout({ shippingAddress, billingAddress: billingSameAsShipping ? shippingAddress : billingAddress, paymentMethod: paymentMethod as 'card' | 'paypal' | 'cash', notes }, cartState, user.uid);
      if (!createdOrder) return;
      clearCart();
      navigate(ROUTES.ORDER_CONFIRMATION(createdOrder.id));
    } catch { /* useCheckout conserva el error visible y el carrito intacto. */ }
  };

  return (
    <>
      <Header />
      <Container as="main" className="py-8 sm:py-12">
        <div className="mb-8 flex items-center gap-2 text-sm"><Link to={ROUTES.CART} className="text-slate-500 hover:text-cyan-300">Carrito</Link><span className="text-slate-700">/</span><span className="text-cyan-200">Checkout</span></div>
        {items.length === 0 ? <EmptyState config={{ title: 'Tu carrito está vacío', description: 'Agrega productos antes de proceder al pago.', actionLabel: 'Ver catálogo', actionHref: ROUTES.CATALOG }} /> : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-8"><p className="cyber-kicker">CHECKOUT // SECURE SESSION</p><h1 className="mt-2 font-display text-3xl font-black uppercase text-white">Completa tu pedido</h1><p className="mt-2 text-slate-400">Usamos los datos del formulario para preparar tu envío.</p></div>
              <form onSubmit={handleSubmit} className="space-y-7">
                <section className="cyber-panel rounded-xl p-5 sm:p-6"><h2 className="font-display text-base font-bold uppercase text-white">01 · Envío</h2><div className="mt-5 space-y-4"><Input label="Calle y número" value={shippingAddress.street} onChange={(e) => handleShippingChange('street', e.target.value)} required /><div className="grid gap-4 sm:grid-cols-2"><Input label="Ciudad" value={shippingAddress.city} onChange={(e) => handleShippingChange('city', e.target.value)} required /><Input label="Provincia / Estado" value={shippingAddress.state} onChange={(e) => handleShippingChange('state', e.target.value)} required /></div><div className="grid gap-4 sm:grid-cols-2"><Input label="Código postal" value={shippingAddress.zipCode} onChange={(e) => handleShippingChange('zipCode', e.target.value)} required /><Input label="País" value={shippingAddress.country} onChange={(e) => handleShippingChange('country', e.target.value)} placeholder="Argentina" required /></div></div></section>
                <section className="cyber-panel rounded-xl p-5 sm:p-6"><div className="flex items-start gap-3"><input type="checkbox" id="billing-same" className="mt-1 h-5 w-5 accent-cyan-400" checked={billingSameAsShipping} onChange={(e) => setBillingSameAsShipping(e.target.checked)} /><label htmlFor="billing-same" className="text-sm text-slate-300">La dirección de facturación es igual al envío.</label></div>{!billingSameAsShipping && <div className="mt-5 space-y-4"><h3 className="font-display text-sm font-bold uppercase text-cyan-200">Dirección de facturación</h3><Input label="Calle y número" value={billingAddress.street} onChange={(e) => handleBillingChange('street', e.target.value)} required /><div className="grid gap-4 sm:grid-cols-2"><Input label="Ciudad" value={billingAddress.city} onChange={(e) => handleBillingChange('city', e.target.value)} required /><Input label="Provincia / Estado" value={billingAddress.state} onChange={(e) => handleBillingChange('state', e.target.value)} required /></div><div className="grid gap-4 sm:grid-cols-2"><Input label="Código postal" value={billingAddress.zipCode} onChange={(e) => handleBillingChange('zipCode', e.target.value)} required /><Input label="País" value={billingAddress.country} onChange={(e) => handleBillingChange('country', e.target.value)} required /></div></div>}</section>
                <section className="cyber-panel rounded-xl p-5 sm:p-6"><h2 className="font-display text-base font-bold uppercase text-white">02 · Pago</h2><div className="mt-5"><Select label="Método de pago" options={PAYMENT_METHODS.map((method) => ({ value: method, label: PAYMENT_LABELS[method] ?? method }))} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} /></div></section>
                <Textarea label="Notas (opcional)" placeholder="Instrucciones especiales para la entrega..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                {checkoutError && <div className="rounded-lg border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200"><strong>No pudimos completar el pedido.</strong><p className="mt-1 text-red-200/80">{checkoutError.message}</p><p className="mt-2 text-xs text-red-200/60">Tu carrito no fue borrado. Puedes corregir el problema e intentarlo otra vez.</p></div>}
                <Button type="submit" variant="solid" size="lg" className="w-full border border-cyan-300/40 bg-cyan-400 font-display uppercase tracking-wider text-slate-950" disabled={isProcessing}>{isProcessing ? 'Procesando pedido...' : <>Confirmar pedido <span className="ml-2"><Price amount={totalPrice} /></span></>}</Button>
              </form>
            </div>
            <aside className="lg:sticky lg:top-24 lg:self-start"><div className="cyber-panel rounded-xl p-5 sm:p-6"><p className="cyber-kicker">ORDER SUMMARY</p><h2 className="mt-2 font-display text-lg font-bold uppercase text-white">Tu pedido</h2><div className="mt-5 space-y-4">{items.map((item) => <div key={item.productId} className="flex items-center gap-3"><img src={resolveProductImage(item)} alt={item.image.alt} className="h-14 w-14 rounded-md border border-cyan-400/15 object-cover" onError={handleProductImageError} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-200">{item.name}</p><p className="text-xs text-slate-500">x{item.quantity}</p></div><Price amount={item.price.amount * item.quantity} currency={item.price.currency} /></div>)}</div><div className="mt-6 border-t border-cyan-400/10 pt-5"><div className="flex justify-between text-sm text-slate-400"><span>Envío</span><span className="text-cyan-300">Gratis</span></div><div className="mt-3 flex items-end justify-between"><span className="font-display text-sm uppercase text-white">Total</span><Price amount={totalPrice} className="text-xl font-bold text-cyan-300" /></div></div><div className="mt-5 rounded-lg border border-fuchsia-400/15 bg-fuchsia-400/5 p-3 text-xs leading-5 text-slate-400">🔒 El precio final se valida en el servidor antes de crear la orden.</div></div></aside>
          </div>
        )}
      </Container>
    </>
  );
}

export default CheckoutPage;
