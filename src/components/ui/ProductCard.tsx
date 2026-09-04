import { type ReactNode } from 'react';
import Button from './Button';
import type { ProductCardVariant } from '@/types/ui';
import { handleProductImageError } from '@/utils/productImage';

export interface ProductCardProps {
  readonly id: string;
  readonly name: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly src: string;
  readonly imageAlt?: string;
  readonly category?: string;
  readonly rating?: number;
  readonly reviewCount?: number;
  readonly stock: number;
  readonly badge?: ReactNode;
  readonly variant?: ProductCardVariant;
  readonly onAddToCart?: (id: string) => void;
  readonly onQuickView?: (id: string) => void;
}

const priceVariantClasses: Record<ProductCardVariant, string> = {
  default: 'text-xl',
  compact: 'text-lg',
  featured: 'text-2xl',
};

export function ProductCard({
  id,
  name,
  priceCents,
  currency,
  src,
  imageAlt,
  category,
  rating,
  reviewCount,
  stock,
  badge,
  variant = 'default',
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  const formattedPrice = (priceCents / 100).toLocaleString('en-US', { style: 'currency', currency });
  const imageWrapperClasses = variant === 'compact' ? 'aspect-[4/3]' : variant === 'featured' ? 'aspect-[16/9]' : 'aspect-[3/4]';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-cyan-400/15 bg-slate-950/75 shadow-[0_12px_35px_rgba(0,0,0,0.28)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyan-300/45 hover:shadow-[0_18px_45px_rgba(34,211,238,0.12)]">
      <div className={`relative ${imageWrapperClasses} overflow-hidden bg-slate-900`}>
        <img src={src} alt={imageAlt ?? name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={handleProductImageError} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent opacity-80" />
        {badge && <div className="absolute right-3 top-3 z-10">{badge}</div>}
        {stock === 0 && <span className="absolute left-3 top-3 z-10 rounded border border-red-300/30 bg-red-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-red-200">Agotado</span>}
        {stock > 0 && stock <= 3 && <span className="absolute left-3 top-3 z-10 rounded border border-fuchsia-300/30 bg-fuchsia-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-fuchsia-200">Últimas unidades</span>}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {category && <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400/80">{category}</span>}
        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-5 text-slate-100">{name}</h3>

        {rating !== undefined && (
          <div className="mt-2 flex items-center gap-1.5 text-sm">
            <span className="text-amber-300">★</span>
            <span className="font-semibold text-slate-200">{rating.toFixed(1)}</span>
            <span className="text-slate-500">({reviewCount ?? 0})</span>
          </div>
        )}

        <div className="mt-auto">
          <p className={`mt-4 font-display ${priceVariantClasses[variant]} font-bold text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.25)]`}>{formattedPrice}</p>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            {onAddToCart && <Button variant="solid" onClick={() => onAddToCart(id)} disabled={stock === 0} className="min-h-11 border border-cyan-300/30 bg-cyan-400 font-bold text-slate-950 hover:bg-cyan-300">{stock === 0 ? 'Agotado' : 'Agregar'}</Button>}
            {onQuickView && <Button variant="outline" onClick={() => onQuickView(id)} className="min-h-11 border-slate-600 bg-transparent px-3 text-slate-200 hover:border-fuchsia-400/50 hover:bg-fuchsia-400/10 hover:text-fuchsia-200" aria-label={`Vista rápida de ${name}`}>Ver</Button>}
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
