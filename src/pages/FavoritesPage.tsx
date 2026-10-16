import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/layout/Header';
import { ProductList } from '@/components/catalog/ProductList';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/hooks/useCart';
import { productsService } from '@/services/productsService';
import type { Product } from '@/types/domain';

export function FavoritesPage() {
  const { favoriteIds } = useFavorites();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (favoriteIds.length === 0) {
      setProducts([]);
      setError(null);
      setIsLoading(false);
      return () => { active = false; };
    }
    setIsLoading(true);
    setError(null);
    Promise.all(favoriteIds.map((id) => productsService.fetchProduct(id)))
      .then((results) => {
        if (active) setProducts(results.filter((product): product is Product => Boolean(product && product.isActive)));
      })
      .catch(() => { if (active) setError('No pudimos cargar tus favoritos. Inténtalo nuevamente.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [favoriteIds]);

  return <>
    <Header />
    <Container className="py-8 sm:py-12">
      <div className="mb-8">
        <p className="cyber-kicker">TU LISTA PERSONAL</p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase text-white sm:text-4xl">Favoritos <span className="text-fuchsia-400">♥</span></h1>
        <p className="mt-2 text-slate-400">Tu lista se guarda en Firestore para esta cuenta y se mantiene separada de las demás sesiones.</p>
      </div>
      {error && <div role="alert" className="mb-6 rounded-xl border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
      {!isLoading && !error && favoriteIds.length > 0 && products.length === 0
        ? <div className="cyber-panel rounded-xl p-8 text-center"><p className="text-slate-300">Los productos favoritos ya no están disponibles.</p></div>
        : <ProductList products={products} isLoading={isLoading} error={error} onAddToCart={(product) => addItem(product, 1)} />}
      {!isLoading && !error && favoriteIds.length === 0 && <div className="cyber-panel mt-6 rounded-xl p-8 text-center"><p className="text-lg font-semibold text-white">Todavía no guardaste favoritos.</p><p className="mt-2 text-sm text-slate-400">Pulsa el corazón de cualquier producto para agregarlo a esta lista.</p><Link to="/catalog" className="mt-4 inline-flex rounded-md bg-cyan-400 px-4 py-2 font-semibold text-slate-950">Explorar catálogo</Link></div>}
    </Container>
  </>;
}

export default FavoritesPage;
