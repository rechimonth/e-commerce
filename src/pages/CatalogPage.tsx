import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Container, Button } from '@/components/ui';
import { ProductList } from '@/components/catalog/ProductList';
import { ProductSearch } from '@/components/catalog/ProductSearch';
import { ProductFilters } from '@/components/catalog/ProductFilters';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Header } from '@/components/layout/Header';
import type { Product, ProductCategory } from '@/types/domain';
import { PRODUCT_CATEGORIES } from '@/types/domain';
import { resolveProductImage } from '@/utils/productImage';
import { ROUTES } from '@/constants/routes';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  'action-figures': 'Figuras de Acción',
  'video-games': 'Videojuegos',
  shoes: 'Zapatillas',
};

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const categoryParam = searchParams.get('category') ?? 'all';
  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { addItem } = useCart();

  const { products, isLoading, error } = useProducts({ searchTerm: localSearch, category: categoryParam as ProductCategory | 'all' });
  const categories = useMemo(() => PRODUCT_CATEGORIES.map((cat) => ({ id: cat, label: CATEGORY_LABELS[cat] })), []);

  const handleCategoryChange = (cat: ProductCategory | 'all') => {
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'all') newParams.delete('category');
    else newParams.set('category', cat);
    setSearchParams(newParams);
  };

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (localSearch) newParams.set('search', localSearch);
    else newParams.delete('search');
    setSearchParams(newParams, { replace: true });
  }, [localSearch, searchParams, setSearchParams]);

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    setQuickViewProduct(null);
  };

  return (
    <>
      <Header />
      <Container className="py-8 sm:py-12">
        <div className="mb-8 flex items-center gap-2 text-sm">
          <Link to={ROUTES.HOME} className="text-slate-500 transition hover:text-cyan-300">Inicio</Link>
          <span className="text-slate-700">/</span>
          <span className="text-cyan-200">Catálogo</span>
        </div>
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><p className="cyber-kicker">PRODUCT DATABASE // ONLINE</p><h1 className="mt-2 font-display text-3xl font-black uppercase text-white sm:text-4xl">Catálogo</h1><p className="mt-2 text-slate-400">Encuentra tu próximo videojuego, coleccionable o par de zapatillas.</p></div>
          <div className="w-full max-w-xl"><ProductSearch value={localSearch} onChange={setLocalSearch} placeholder="Buscar productos..." /></div>
        </div>
        <div className="cyber-panel mb-8 overflow-x-auto rounded-xl p-2"><ProductFilters categories={categories} selected={categoryParam as ProductCategory | 'all'} onSelect={handleCategoryChange} showCounts={false} /></div>
        {error && <div className="cyber-panel mb-6 flex flex-col gap-3 rounded-xl border-red-400/30 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-display text-sm font-bold uppercase text-red-300">Error de conexión</p><p className="mt-1 text-sm text-slate-400">No pudimos cargar el catálogo. Comprueba tu conexión e inténtalo otra vez.</p></div><Button variant="outline" onClick={() => window.location.reload()} className="border-cyan-400/30 bg-transparent text-cyan-200 hover:bg-cyan-400/10">Reintentar</Button></div>}
        <ProductList products={products} isLoading={isLoading} error={error ? <span>{error.message}</span> : null} onAddToCart={handleAddToCart} onQuickView={setQuickViewProduct} />
        {quickViewProduct && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Vista rápida de ${quickViewProduct.name}`}>
          <button className="absolute inset-0 cursor-default" aria-label="Cerrar vista rápida" onClick={() => setQuickViewProduct(null)} />
          <div className="cyber-panel relative z-10 grid w-full max-w-3xl overflow-hidden rounded-2xl sm:grid-cols-2">
            <div className="aspect-square bg-slate-950"><img src={resolveProductImage(quickViewProduct)} alt={quickViewProduct.image.alt ?? quickViewProduct.name} className="h-full w-full object-cover" /></div>
            <div className="flex flex-col p-6 sm:p-8"><p className="cyber-kicker">QUICK VIEW</p><h2 className="mt-3 font-display text-xl font-bold uppercase text-white">{quickViewProduct.name}</h2><p className="mt-2 text-sm text-slate-400">{CATEGORY_LABELS[quickViewProduct.category]}</p><p className="mt-6 font-display text-2xl font-bold text-cyan-300">{(quickViewProduct.price.amount / 100).toLocaleString('en-US', { style: 'currency', currency: quickViewProduct.price.currency })}</p><p className="mt-3 text-sm text-slate-400">{quickViewProduct.stock > 0 ? `${quickViewProduct.stock} unidades disponibles` : 'Sin stock'}</p><div className="mt-auto flex flex-col gap-3 pt-8"><Button disabled={quickViewProduct.stock === 0} onClick={() => handleAddToCart(quickViewProduct)} size="lg" className="bg-cyan-400 font-display uppercase text-slate-950 hover:bg-cyan-300">{quickViewProduct.stock === 0 ? 'Agotado' : 'Agregar al carrito'}</Button><Link to={`/products/${quickViewProduct.id}`} onClick={() => setQuickViewProduct(null)} className="flex h-11 items-center justify-center rounded-md border border-fuchsia-400/30 text-sm font-bold uppercase tracking-wider text-fuchsia-200 transition hover:bg-fuchsia-400/10">Ver ficha completa</Link><Button variant="ghost" onClick={() => setQuickViewProduct(null)} className="text-slate-400 hover:bg-white/5 hover:text-white">Cerrar</Button></div></div>
          </div>
        </div>}
      </Container>
    </>
  );
}

export default CatalogPage;
