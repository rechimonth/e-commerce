import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Container } from '@/components/ui';
import { ProductList } from '@/components/catalog/ProductList';
import { ProductSearch } from '@/components/catalog/ProductSearch';
import { ProductFilters } from '@/components/catalog/ProductFilters';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Header } from '@/components/layout/Header';
import type { Product, ProductCategory } from '@/types/domain';
import { PRODUCT_CATEGORIES } from '@/types/domain';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  'action-figures': 'Figuras de Acción',
  'video-games': 'Videojuegos',
  'shoes': 'Zapatillas',
};

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const categoryParam = searchParams.get('category') ?? 'all';

  const [localSearch, setLocalSearch] = useState(urlSearch);
  const { addItem } = useCart();

  const { products, isLoading, error } = useProducts({
    searchTerm: localSearch,
    category: categoryParam as ProductCategory | 'all',
  });

  const categories = useMemo(
    () => PRODUCT_CATEGORIES.map((cat) => ({ id: cat, label: CATEGORY_LABELS[cat] })),
    [],
  );

  const handleCategoryChange = (cat: ProductCategory | 'all') => {
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    if (localSearch) {
      newParams.delete('search');
      setLocalSearch('');
    }
    setSearchParams(newParams);
  };

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (localSearch) {
      newParams.set('search', localSearch);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams, { replace: true });
  }, [localSearch, searchParams, setSearchParams]);

  return (
    <>
      <Header />
      <Container className="py-8">
        <div className="mb-6 flex items-center gap-2">
          <Link to="/" className="text-neutral-600 hover:text-neutral-900">
            Inicio
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-900">Catálogo</span>
        </div>

        <div className="mb-6 max-w-md">
          <ProductSearch value={localSearch} onChange={setLocalSearch} placeholder="Buscar productos..." />
        </div>

        <div className="mb-6">
          <ProductFilters
            categories={categories}
            selected={categoryParam as ProductCategory | 'all'}
            onSelect={handleCategoryChange}
            showCounts={false}
          />
        </div>

        {error && <div className="mb-4 rounded-md bg-error-500/10 p-4 text-sm text-error-700">{error.message}</div>}

        <ProductList
          products={products}
          isLoading={isLoading}
          error={error ? <span>{error.message}</span> : null}
          onAddToCart={(product: Product) => addItem(product, 1)}
          onQuickView={() => {}}
        />
      </Container>
    </>
  );
}

export default CatalogPage;
