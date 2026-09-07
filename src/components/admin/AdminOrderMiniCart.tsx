import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import type { Product } from '@/types/domain';

export interface AdminOrderMiniCartItem extends Product {
  readonly quantity: number;
}

interface AdminOrderMiniCartProps {
  readonly items: readonly AdminOrderMiniCartItem[];
  readonly totalUnits: number;
  readonly totalAmount: number;
  readonly currency: string;
  readonly onIncrement: (productId: string) => void;
  readonly onDecrement: (productId: string) => void;
  readonly onRemove: (productId: string) => void;
}

function MinusIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

function ChevronIcon({ open }: { readonly open: boolean }) {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={open ? 'rotate-180 transition-transform' : 'transition-transform'}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function AdminOrderMiniCart({
  items,
  totalUnits,
  totalAmount,
  currency,
  onIncrement,
  onDecrement,
  onRemove,
}: AdminOrderMiniCartProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (items.length === 0) return null;

  return (
    <aside
      aria-label="Resumen flotante de la orden"
      className="fixed bottom-4 right-4 z-40 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-950/95 text-slate-100 shadow-2xl shadow-cyan-950/40 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="admin-order-mini-cart-content"
        className="flex min-h-16 w-full items-center justify-between gap-3 border-b border-cyan-400/15 px-4 py-3 text-left transition-colors hover:bg-cyan-400/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-300"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.12)]">
            <CartIcon />
            <span className="absolute -right-2 -top-2 flex min-h-6 min-w-6 items-center justify-center rounded-full border border-slate-950 bg-cyan-400 px-1.5 text-xs font-black text-slate-950 shadow-[0_0_14px_rgba(34,211,238,0.4)]">
              {totalUnits}
            </span>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-white">Resumen de la orden</span>
            <span className="block text-xs text-slate-400">
              {totalUnits} {totalUnits === 1 ? 'ítem' : 'ítems'} · {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </span>
          </span>
        </span>
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && (
        <div id="admin-order-mini-cart-content" className="bg-slate-950/90">
          <div className="max-h-72 overflow-y-auto px-3 py-2">
            <ul className="divide-y divide-cyan-400/10">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-cyan-400/15 bg-slate-900 ring-1 ring-cyan-400/5">
                    <img src={item.image.url} alt={item.image.alt} className="h-full w-full object-cover" loading="lazy" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100" title={item.name}>{item.name}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="font-bold text-cyan-300">
                        <Price amount={item.price.amount * item.quantity} currency={item.price.currency} />
                      </span>
                      <span className="text-xs text-slate-500">
                        <Price amount={item.price.amount} currency={item.price.currency} /> c/u
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-lg border border-cyan-400/20 bg-slate-900/80">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDecrement(item.id)}
                          disabled={item.quantity <= 1}
                          aria-label={`Reducir cantidad de ${item.name}`}
                          className="h-9 w-9 p-0 text-slate-300 hover:bg-cyan-400/10 hover:text-cyan-200"
                        >
                          <MinusIcon />
                        </Button>
                        <span className="min-w-8 text-center text-sm font-bold text-slate-100" aria-label={`Cantidad ${item.quantity}`}>
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onIncrement(item.id)}
                          disabled={item.quantity >= item.stock}
                          aria-label={`Aumentar cantidad de ${item.name}`}
                          className="h-9 w-9 p-0 text-slate-300 hover:bg-cyan-400/10 hover:text-cyan-200"
                        >
                          <PlusIcon />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(item.id)}
                        aria-label={`Eliminar ${item.name} de la orden`}
                        className="h-9 w-9 p-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-cyan-400/15 bg-slate-900/80 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-slate-400">Total</span>
              <span className="text-lg font-black text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.25)]">
                <Price amount={totalAmount} currency={currency} />
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Los cambios se reflejan también en la tabla principal.</p>
          </div>
        </div>
      )}
    </aside>
  );
}

export default AdminOrderMiniCart;
