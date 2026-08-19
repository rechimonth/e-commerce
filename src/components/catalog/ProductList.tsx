import { type ReactNode } from 'react';
import { ProductCard, LoadingState, EmptyState } from '@/components/ui';
import type { Product } from '@/types/domain';
import { resolveProductImage } from '@/utils/productImage';

export interface ProductListProps {
  readonly products: readonly Product[];
  readonly isLoading: boolean;
  readonly error: ReactNode;
  readonly onAddToCart?: (product: Product) => void;
  readonly onQuickView?: (product: Product) => void;
}

export function ProductList({
  products,
  isLoading,
  error,
  onAddToCart,
  onQuickView,
}: ProductListProps) {
  if (isLoading) {
    return <LoadingState message="Cargando productos..." />;
  }

  if (error) {
    return <EmptyState config={{ title: 'Error al cargar productos', description: 'Intenta de nuevo.' }} />;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-neutral-500">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          priceCents={product.price.amount}
          currency={product.price.currency}
          src={resolveProductImage(product)}
          imageAlt={product.image.alt}
          category={product.category}
          stock={product.stock}
          rating={product.rating}
          reviewCount={product.reviewCount}
          onAddToCart={() => onAddToCart?.(product)}
          onQuickView={() => onQuickView?.(product)}
        />
      ))}
    </div>
  );
}
