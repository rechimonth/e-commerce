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
import { useCart } from '@/hooks/useCart';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const safeId = id ?? '';

  const { product, isLoading, error, status } = useProduct(safeId);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const isError = status === 'error';
  const noId = !id;

  if (noId) {
    return (
      <>
        <Header />
        <Container className="py-8">
          <EmptyState
            config={{
              title: 'Producto no encontrado',
              description: 'No se proporcionó un ID de producto válido.',
              actionLabel: 'Ver catálogo',
              actionHref: '/catalog',
            }}
          />
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container className="py-8">
        <div className="mb-6 flex items-center gap-2">
          <Link to="/catalog" className="text-neutral-600 hover:text-neutral-900">
            Catálogo
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-900">Detalle</span>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {isError && error && (
          <EmptyState
            config={{
              title: 'Error',
              description: error.message,
              actionLabel: 'Intentar de nuevo',
              actionHref: '/catalog',
            }}
          />
        )}

        {product && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
              <img
                src={product.image.url}
                alt={product.image.alt}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-neutral-900">{product.name}</h1>
              <Badge variant="success" className="mt-2 w-fit">
                {product.category}
              </Badge>

              <div className="mt-4">
                <Price amount={product.price.amount} currency={product.price.currency} locale="en-US" />
                <span className="ml-2 text-sm text-neutral-500">
                  ({product.reviewCount} reseñas)
                </span>
              </div>

              <p className="mt-4 text-neutral-600">{product.description}</p>

              <div className="mt-6 flex items-center gap-4">
                <QuantitySelector
                  quantity={quantity}
                  min={1}
                  max={product.stock}
                  onChange={setQuantity}
                  buttonSize="md"
                />
                <Button
                  variant="solid"
                  size="lg"
                  onClick={() => addItem(product, quantity)}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}

export default ProductDetailPage;

