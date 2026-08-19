export const DEFAULT_PRODUCT_IMAGE = '/placeholder.svg';

export function resolveProductImage(product: {
  readonly imageUrl?: string;
  readonly image?: { readonly url?: string };
  readonly imageKey?: string;
}): string {
  return product.imageUrl || product.image?.url || product.imageKey || DEFAULT_PRODUCT_IMAGE;
}

export function handleProductImageError(event: { readonly currentTarget: HTMLImageElement }): void {
  const img = event.currentTarget;
  if (!img.dataset.fallbackApplied) {
    img.dataset.fallbackApplied = 'true';
    img.src = DEFAULT_PRODUCT_IMAGE;
  }
}
