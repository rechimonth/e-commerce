import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
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

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const safeId = id ?? '';
  const { product, isLoading, error, status } = useProduct(safeId);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
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
      </Container>
    </>
  );
}

export default ProductDetailPage;
