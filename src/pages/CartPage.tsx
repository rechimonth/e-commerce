import { useState } from 'react';
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

const FREE_SHIPPING_THRESHOLD_CENTS = 10000;

export function CartPage() {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - totalPrice.amount);
  const progress = Math.min(100, (totalPrice.amount / FREE_SHIPPING_THRESHOLD_CENTS) * 100);

  return (
    <>
      <Header />
      <Container as="main" className="py-8 sm:py-12">
        <div className="mb-8 flex items-center gap-2 text-sm"><Link to={ROUTES.HOME} className="text-slate-500 hover:text-cyan-300">Inicio</Link><span className="text-slate-700">/</span><span className="text-cyan-200">Carrito</span></div>
        {items.length === 0 ? <EmptyState config={EMPTY_STATES.cart} /> : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-6"><p className="cyber-kicker">CART // READY</p><h1 className="mt-2 font-display text-3xl font-black uppercase text-white">Tu carrito</h1><p className="mt-2 text-slate-400">{totalItems} {totalItems === 1 ? 'producto' : 'productos'} listos para continuar.</p></div>
              <div className="space-y-4">{items.map((item) => <CartItemRow key={item.productId} item={item} onUpdateQuantity={updateQuantity} onRemove={removeItem} />)}</div>
              <div className="mt-6 flex items-center gap-3">
                {!confirmClear ? <Button variant="outline" onClick={() => setConfirmClear(true)} className="border-red-400/25 text-red-200 hover:bg-red-500/10">Vaciar carrito</Button> : <><span className="text-sm text-slate-400">¿Seguro que quieres borrar todo?</span><Button variant="danger" onClick={() => { clearCart(); setConfirmClear(false); }}>Sí, vaciar</Button><Button variant="ghost" onClick={() => setConfirmClear(false)}>Cancelar</Button></>}
              </div>
            </div>
            <aside className="lg:sticky lg:top-24 lg:self-start"><div className="cyber-panel rounded-xl p-5 sm:p-6"><p className="cyber-kicker">ORDER SUMMARY</p><h2 className="mt-2 font-display text-lg font-bold uppercase text-white">Resumen</h2><div className="mt-6 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-400">Subtotal</span><Price amount={totalPrice} className="text-slate-200" /></div><div className="flex justify-between"><span className="text-slate-400">Elementos</span><span className="text-slate-200">{totalItems}</span></div><div className="flex justify-between"><span className="text-slate-400">Envío</span><span className="font-semibold text-cyan-300">Gratis</span></div><div className="border-t border-cyan-400/10 pt-4"><div className="flex justify-between text-lg font-bold"><span className="font-display uppercase text-white">Total</span><Price amount={totalPrice} className="font-display text-cyan-300" /></div></div></div><div className="mt-6 rounded-lg border border-cyan-400/15 bg-cyan-400/5 p-4"><div className="flex justify-between text-xs font-semibold text-slate-300"><span>Envío gratis</span><span>{progress.toFixed(0)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs leading-5 text-slate-500">{remainingForFreeShipping > 0 ? <>Te faltan <Price amount={remainingForFreeShipping} /> para alcanzar el envío gratis.</> : '¡Envío gratis desbloqueado!'}</p></div><Button variant="solid" size="lg" className="mt-6 w-full bg-cyan-400 font-display uppercase text-slate-950 hover:bg-cyan-300" asChild><Link to={ROUTES.CHECKOUT}>Continuar al checkout</Link></Button><Button variant="outline" size="md" className="mt-3 w-full" asChild><Link to={ROUTES.CATALOG}>Seguir comprando</Link></Button></div></aside>
          </div>
        )}
      </Container>
    </>
  );
}

export default CartPage;
