import { useState } from 'react';
import {
  Button,
  Card,
  Badge,
  Alert,
  Price,
  Spinner,
  Skeleton,
  LoadingState,
  EmptyState,
  ErrorState,
  QuantitySelector,
  SearchInput,
  CategoryFilter,
  OrderStatusBadge,
  CursorControls,
  Container,
  ProductCard,
} from '@/components/ui';
import type { ProductCategory } from '@/types/domain';

const buttonVariants = ['solid', 'outline', 'danger', 'link'] as const;
const buttonSizes = ['sm', 'md', 'lg'] as const;
const alertVariants = ['info', 'success', 'warning', 'error'] as const;
const badgeVariants = ['default', 'success', 'warning', 'error'] as const;
const skeletonVariants = ['default', 'rounded', 'circular'] as const;
const orderStatuses = ['pending', 'processing', 'completed', 'cancelled'] as const;
const productVariants = ['default', 'compact', 'featured'] as const;

export default function Playground() {
  const [quantity, setQuantity] = useState(2);
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');

  return (
    <Container as="main" className="min-h-screen bg-neutral-50 py-8">
      <div className="mx-auto max-w-6xl space-y-12">
        <h1 className="text-3xl font-bold text-neutral-900">UI Kit Playground</h1>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Button</h2>
          <div className="flex flex-wrap gap-4 items-end">
            {buttonVariants.map((variant) =>
              buttonSizes.map((size) => (
                <Button key={`${variant}-${size}`} variant={variant} size={size}>
                  {variant} ({size})
                </Button>
              )),
            )}
            <Button variant="solid" leftIcon={<span>★</span>}>
              Con icono
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Badge</h2>
          <div className="flex flex-wrap gap-2">
            {badgeVariants.map((variant) => (
              <Badge key={variant} variant={variant}>
                {variant}
              </Badge>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Alert</h2>
          <div className="space-y-2">
            {alertVariants.map((variant) => (
              <Alert
                key={variant}
                variant={variant}
                title={variant.charAt(0).toUpperCase() + variant.slice(1)}
                message={`Este es un mensaje de alerta ${variant}`}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Price</h2>
          <Price amount={2999} currency="USD" />
          <Price amount={12999} currency="EUR" locale="de-DE" />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Spinner</h2>
          <div className="flex items-end gap-4">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Skeleton</h2>
          <div className="space-y-2">
            {skeletonVariants.map((variant) => (
              <Skeleton key={variant} variant={variant} className="h-4 w-32" />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">LoadingState</h2>
          <LoadingState message="Cargando datos..." />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">EmptyState</h2>
          <EmptyState
            config={{
              title: 'No hay elementos',
              description: 'Añade algunos elementos para comenzar.',
              actionLabel: 'Ver catálogo',
              actionHref: '/',
            }}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">ErrorState</h2>
          <ErrorState message="Error de conexión." retryLabel="Reintentar" onRetry={() => {}} />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">QuantitySelector</h2>
          <QuantitySelector quantity={quantity} min={1} max={20} onChange={setQuantity} />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">SearchInput</h2>
          <SearchInput
            placeholder="Buscar productos..."
            onSearch={setSearchValue}
            className="max-w-md"
          />
          {searchValue && <p className="text-sm text-neutral-600">Valor: {searchValue}</p>}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">CategoryFilter</h2>
          <CategoryFilter
            categories={[
              { id: 'action-figures', label: 'Electrónicos', count: 12 },
              { id: 'video-games', label: 'Videojuegos', count: 5 },
              { id: 'shoes', label: 'Zapatillas', count: 8 },
            ]}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            showCounts
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">OrderStatusBadge</h2>
          <div className="flex flex-wrap gap-2">
            {orderStatuses.map((status) => (
              <OrderStatusBadge key={status} status={status} showIcon />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Pagination (CursorControls)</h2>
          <CursorControls
            hasMore
            isLoading={false}
            onNext={() => {}}
            onPrevious={() => {}}
            canGoPrevious
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Card</h2>
          <Card
            header={<h3 className="text-lg font-semibold">Título de Card</h3>}
            footer={<p className="text-sm text-neutral-600">Footer content</p>}
          >
            <p>Contenido de la card.</p>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">ProductCard</h2>
          <div className="flex flex-wrap gap-6">
            {productVariants.map((variant) => (
              <div key={variant} className="w-64">
                <ProductCard
                  id="prod-1"
                  name="Producto de Prueba"
                  priceCents={9999}
                  currency="USD"
                  imageUrl="https://via.placeholder.com/150"
                  category="action-figures"
                  rating={4.5}
                  reviewCount={128}
                  stock={10}
                  variant={variant}
                  badge={<Badge variant="success">Nuevo</Badge>}
                  onAddToCart={() => {}}
                  onQuickView={() => {}}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
