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

const compactPriceClasses = 'text-lg font-bold';
const defaultPriceClasses = 'text-xl font-bold';
const featuredPriceClasses = 'text-2xl font-bold';

const priceVariantClasses: Record<ProductCardVariant, string> = {
  default: defaultPriceClasses,
  compact: compactPriceClasses,
  featured: featuredPriceClasses,
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
  const formattedPrice = (priceCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency,
  });

  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  const imageWrapperClasses = isCompact
    ? 'aspect-[4/3]'
    : isFeatured
      ? 'aspect-[16/9]'
      : 'aspect-[3/4]';

  const containerClasses = isCompact ? 'max-w-xs' : isFeatured ? 'max-w-sm' : 'max-w-xs';

  const paddingClasses = isCompact ? 'p-3' : 'p-4';

  return (
    <div
      className={`group relative flex flex-col ${containerClasses} rounded-lg border border-neutral-200 bg-white transition-all duration-200 hover:shadow-lg`}
    >
      <div className={`relative ${imageWrapperClasses} overflow-hidden rounded-t-md shadow-sm`}>
        <img
          src={src}
          alt={imageAlt ?? name}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          onError={handleProductImageError}
        />
        {badge && <div className="absolute top-2 right-2 z-10">{badge}</div>}
        {stock === 0 && (
          <span className="absolute top-2 left-2 z-10 rounded-full bg-error-500 px-2 py-1 text-xs font-medium text-white">
            Agotado
          </span>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${paddingClasses}`}>
        {category && <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{category}</span>}
        <h3 className="mt-1 text-sm font-medium text-neutral-900 line-clamp-2">{name}</h3>

        {rating !== undefined && (
          <div className="mt-1 flex items-center gap-1">
            <span className="text-sm font-medium text-neutral-700">{rating.toFixed(1)}</span>
            <span className="text-xs text-neutral-500">({reviewCount ?? 0} reseñas)</span>
          </div>
        )}

        <div className="mt-auto">
          <p className={`mt-2 ${priceVariantClasses[variant]} font-bold text-primary-600`}>
            {formattedPrice}
          </p>

          <div className="mt-3 flex gap-2">
            {onAddToCart && (
              <Button
                variant="solid"
                onClick={() => onAddToCart(id)}
                disabled={stock === 0}
                className="w-full"
              >
                {stock === 0 ? 'Agotado' : 'Agregar'}
              </Button>
            )}
            {onQuickView && (
              <Button
                variant="outline"
                onClick={() => onQuickView(id)}
                className="flex-1"
              >
                Vista rápida
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
