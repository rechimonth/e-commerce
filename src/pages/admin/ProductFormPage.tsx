import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { ImageUploader } from '@/components/upload/ImageUploader';
import { productsService } from '@/services/productsService';
import { ROUTES } from '@/constants/routes';
import { PRODUCT_CATEGORIES } from '@/types/domain';
import type { ProductCategory } from '@/types/domain';
import type { ServiceError } from '@/types/api';

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  category: ProductCategory;
  stock: string;
  imageKey: string;
  imageUrl: string;
  isActive: boolean;
}

interface AdminProductFormPageProps {
  readonly productId?: string;
}

export function AdminProductFormPage({ productId }: AdminProductFormPageProps) {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const id = productId ?? params?.id;
  const isEditMode = !!id;

  const [form, setForm] = useState<ProductFormState>({
    name: '',
    description: '',
    price: '',
    category: 'electronics',
    stock: '',
    imageKey: '',
    imageUrl: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);
  const [success, setSuccess] = useState(false);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const product = await productsService.fetchProduct(id);
      if (product) {
        setForm({
          name: product.name,
          description: product.description,
          price: String(product.price.amount / 100),
          category: product.category,
          stock: String(product.stock),
          imageKey: product.image.key,
          imageUrl: product.image.url,
          isActive: product.isActive,
        });
      }
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al cargar producto',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const handleImageUploaded = (url: string, key: string) => {
    setForm((prev) => ({ ...prev, imageUrl: url, imageKey: key }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    setError(null);

    const priceAmount = Math.round(parseFloat(form.price) * 100);

    try {
      if (isEditMode && id) {
        await productsService.updateProduct(id, {
          name: form.name,
          description: form.description,
          priceCents: priceAmount,
          currency: 'USD',
          category: form.category,
          imageUrl: form.imageUrl,
          imageKey: form.imageKey,
          stock: parseInt(form.stock, 10),
          isActive: form.isActive,
        });
      } else {
        await productsService.createProduct({
          name: form.name,
          description: form.description,
          priceCents: priceAmount,
          currency: 'USD',
          category: form.category,
          imageUrl: form.imageUrl,
          imageKey: form.imageKey,
          stock: parseInt(form.stock, 10),
          isActive: form.isActive,
          createdBy: 'admin',
          rating: 0,
          reviewCount: 0,
        });
      }
      setSuccess(true);
      setTimeout(() => {
        navigate(ROUTES.ADMIN_PRODUCTS);
      }, 1500);
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al guardar producto',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">
          {isEditMode ? 'Editar producto' : 'Nuevo producto'}
        </h1>
        <Link to={ROUTES.ADMIN_PRODUCTS}>
          <Button variant="outline" size="sm">
            Cancelar
          </Button>
        </Link>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Error"
          message={error.message}
        />
      )}

      {success && (
        <Alert
          variant="success"
          title="Exito"
          message={isEditMode ? 'Producto actualizado' : 'Producto creado'}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Informacion del producto
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Nombre"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Descripcion"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                disabled={isSubmitting}
              />
            </div>

            <Input
              label="Precio (USD)"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              required
              disabled={isSubmitting}
            />

            <Select
              label="Categoria"
              options={PRODUCT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category: e.target.value as ProductCategory }))
              }
              disabled={isSubmitting}
            />

            <Input
              label="Stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
              required
              disabled={isSubmitting}
            />

            <div className="md:col-span-2">
              <ImageUploader
                imageUrl={form.imageUrl}
                onImageUploaded={handleImageUploaded}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  disabled={isSubmitting}
                />
                Producto activo
              </label>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="solid"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar producto' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AdminProductFormPage;

