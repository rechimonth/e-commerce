import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { useProduct } from '@/hooks/useProduct';
import { resolveProductImage, handleProductImageError } from '@/utils/productImage';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { reviewsService, type ProductReview } from '@/services/reviewsService';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const safeId = id ?? '';
  const { product, isLoading, error, status, refetch } = useProduct(safeId);
  const { addItem } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setReviewsLoading(true);
    reviewsService.fetchProductReviews(safeId)
      .then((result) => { if (active) setReviews(result); })
      .catch(() => { if (active) setReviewError('No se pudieron cargar las reseñas.'); })
      .finally(() => { if (active) setReviewsLoading(false); });
    return () => { active = false; };
  }, [safeId]);

  const handleSubmitReview = async () => {
    if (!user) {
      setReviewError('Inicia sesión para publicar una reseña.');
      return;
    }
    if (reviewComment.trim().length < 10 || reviewComment.trim().length > 1500) {
      setReviewError('El comentario debe tener entre 10 y 1500 caracteres.');
      return;
    }
    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(null);
    try {
      await reviewsService.submitProductReview(safeId, reviewRating, reviewComment);
      setReviewComment('');
      setReviewSuccess('Reseña guardada. Solo se aceptan reseñas de compras completadas.');
      setReviews(await reviewsService.fetchProductReviews(safeId));
      refetch();
    } catch (submitError) {
      setReviewError(submitError instanceof Error ? submitError.message : 'No se pudo guardar la reseña.');
    } finally {
      setReviewSubmitting(false);
    }
  };
  const isError = status === 'error';
  const noId = !id;

  if (noId) return <><Header /><Container className="py-8"><EmptyState config={{ title: 'Producto no encontrado', description: 'No se proporcionó un ID de producto válido.', actionLabel: 'Ver catálogo', actionHref: '/catalog' }} /></Container></>;

  return (
    <>
      <Header />
      <Container className="py-8 sm:py-12">
        <div className="mb-8 flex items-center gap-2 text-sm"><Link to="/catalog" className="text-slate-500 hover:text-cyan-300">Catálogo</Link><span className="text-slate-700">/</span><span className="text-cyan-200">Detalle</span></div>
        {isLoading && <div className="cyber-panel flex items-center justify-center rounded-xl py-20"><Spinner size="lg" /></div>}
        {isError && error && <EmptyState config={{ title: 'No pudimos cargar el producto', description: error.message, actionLabel: 'Volver al catálogo', actionHref: '/catalog' }} />}
        {product && <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="cyber-panel aspect-square overflow-hidden rounded-2xl p-2"><img src={resolveProductImage(product)} alt={product.image.alt} className="h-full w-full rounded-xl object-cover" onError={handleProductImageError} /></div>
          <div className="cyber-panel flex flex-col rounded-2xl p-6 sm:p-8">
            <p className="cyber-kicker">PRODUCT // DETAIL</p>
            <h1 className="mt-3 font-display text-2xl font-black uppercase leading-tight text-white sm:text-4xl">{product.name}</h1>
            <Badge variant="success" className="mt-4 w-fit">{product.category}</Badge>
            <div className="mt-6 flex items-end gap-3"><Price amount={product.price.amount} currency={product.price.currency} locale="en-US" className="font-display text-3xl font-bold text-cyan-300" /><span className="pb-1 text-sm text-slate-500">({product.reviewCount} reseñas)</span></div>
            <p className="mt-5 leading-7 text-slate-300">{product.description}</p>
            <div className="mt-5 flex items-center gap-2 text-sm">{product.stock > 0 ? <span className="text-cyan-300">● {product.stock} unidades disponibles</span> : <span className="text-red-300">● Sin stock</span>}</div>
            <div className="mt-auto flex flex-col gap-4 pt-8 sm:flex-row sm:items-center"><QuantitySelector quantity={quantity} min={1} max={product.stock} onChange={setQuantity} buttonSize="md" /><Button variant="solid" size="lg" className="flex-1 bg-cyan-400 font-display uppercase text-slate-950 hover:bg-cyan-300" onClick={() => addItem(product, quantity)} disabled={product.stock === 0}>{product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}</Button></div>
            <div className="mt-6 grid gap-3 border-t border-cyan-400/10 pt-5 text-xs text-slate-500 sm:grid-cols-3"><span>⚡ Envío rápido</span><span>↺ Cambios simples</span><span>🔒 Compra segura</span></div>
          </div>
        </div>}
        {product && <section className="mt-10 space-y-6" aria-labelledby="product-reviews-heading">
          <div className="cyber-panel rounded-2xl p-6 sm:p-8">
            <p className="cyber-kicker">CUSTOMER FEEDBACK</p>
            <h2 id="product-reviews-heading" className="mt-2 font-display text-xl font-bold uppercase text-white">Reseñas de clientes</h2>
            <p className="mt-2 text-sm text-slate-400">Las reseñas solo se publican cuando el servidor confirma una compra completada.</p>
            {user ? <div className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-200">Tu puntuación</p>
                <div className="flex gap-2" role="group" aria-label="Puntuación de 1 a 5 estrellas">
                  {[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" aria-label={`${star} estrellas`} aria-pressed={reviewRating === star} onClick={() => setReviewRating(star)} className={`rounded-lg border px-3 py-2 text-lg transition ${star <= reviewRating ? 'border-amber-300/50 bg-amber-300/10 text-amber-300' : 'border-slate-700 text-slate-500'}`}>★</button>)}
                </div>
              </div>
              <label className="block text-sm font-semibold text-slate-200" htmlFor="product-review-comment">Comentario</label>
              <textarea id="product-review-comment" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} rows={4} maxLength={1500} placeholder="¿Qué te pareció el producto? (mínimo 10 caracteres)" className="w-full rounded-xl border border-cyan-300/15 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-slate-500">{reviewComment.trim().length}/1500 caracteres</span>
                <Button onClick={handleSubmitReview} disabled={reviewSubmitting || reviewComment.trim().length < 10 || reviewComment.trim().length > 1500}>{reviewSubmitting ? 'Publicando...' : 'Publicar reseña'}</Button>
              </div>
            </div> : <p className="mt-4 text-sm text-slate-400">Inicia sesión para dejar una reseña después de completar una compra.</p>}
            {reviewError && <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-500/5 px-3 py-2 text-sm text-red-300">{reviewError}</p>}
            {reviewSuccess && <p role="status" className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-300">{reviewSuccess}</p>}
          </div>
          <div className="space-y-3">
            {reviewsLoading ? <p className="py-6 text-center text-sm text-slate-500">Cargando reseñas...</p> : reviews.length === 0 ? <div className="cyber-panel rounded-xl p-6 text-sm text-slate-400">Todavía no hay reseñas para este producto.</div> : reviews.map((review) => <article key={review.id} className="cyber-panel rounded-xl p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div><h3 className="font-semibold text-white">{review.displayName}</h3><p className="text-sm tracking-widest text-amber-300" aria-label={`${review.rating} de 5 estrellas`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p></div>
                <time className="text-xs text-slate-500" dateTime={review.createdAt.toISOString()}>{review.createdAt.toLocaleDateString('es-AR')}</time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{review.comment}</p>
            </article>)}
          </div>
        </section>}
      </Container>
    </>
  );
}

export default ProductDetailPage;
