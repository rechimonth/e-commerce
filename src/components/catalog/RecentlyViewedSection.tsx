import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { recentlyViewedService } from '@/services/recentlyViewedService';
import { resolveProductImage, handleProductImageError } from '@/utils/productImage';
import { Price } from '@/components/ui/Price';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import type { Product } from '@/types/domain';

export function RecentlyViewedSection() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user?.uid) {
      setProducts([]);
      return () => { active = false; };
    }
    setLoading(true);
    recentlyViewedService.fetch(user.uid)
      .then((result) => { if (active) setProducts(result); })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.uid]);

  if (!user) return null;

  return (
    <section className="mt-12" aria-labelledby="recently-viewed-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="cyber-kicker">YOUR BROWSING HISTORY</p>
          <h2 id="recently-viewed-heading" className="mt-1 font-display text-xl font-bold uppercase text-white">Vistos recientemente</h2>
        </div>
        <span className="text-xs text-slate-500">Últimos 5 productos</span>
      </div>
      {loading ? <p className="py-4 text-sm text-slate-500">Cargando historial...</p>
        : products.length === 0 ? <div className="cyber-panel rounded-xl p-5 text-sm text-slate-400">Todavía no visitaste productos. Abre una ficha y aparecerá aquí.</div>
        : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((product) => (
            <article key={product.id} className="cyber-panel group relative overflow-hidden rounded-xl transition hover:border-cyan-300/40">
              <Link to={`/products/${product.id}`} className="block">
                <div className="aspect-square overflow-hidden bg-slate-950">
                  <img src={resolveProductImage(product)} alt={product.name} onError={handleProductImageError} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-white">{product.name}</h3>
                  <Price amount={product.price.amount} currency={product.price.currency} className="mt-2 block text-sm font-bold text-cyan-300" />
                </div>
              </Link>
              <FavoriteButton productId={product.id} productName={product.name} className="absolute right-2 top-2 z-10" />
            </article>
          ))}
        </div>}
    </section>
  );
}

export default RecentlyViewedSection;
