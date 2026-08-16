import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Price } from '@/components/ui/Price';
import { productsService } from '@/services/productsService';
import { ROUTES } from '@/constants/routes';
import type { Product } from '@/types/domain';
import type { PaginatedResult } from '@/types/api';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

interface AdminProductsPageState {
  products: Product[] | null;
  status: AsyncStatus;
  error: ServiceError | null;
}

export function AdminProductsPage() {
  const [state, setState] = useState<AdminProductsPageState>({
    products: null,
    status: 'loading',
    error: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    try {
      const result: PaginatedResult<Product> = await productsService.fetchProductsAdmin();
      setState({ products: result.items as Product[], status: 'success', error: null });
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al cargar productos',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setState({ products: null, status: 'error', error: err });
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await productsService.deleteProduct(productToDelete.id);
      setDeleteModalOpen(false);
      setProductToDelete(null);
      void fetchProducts();
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al eliminar producto',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setState((prev) => ({ ...prev, error: err }));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = state.products?.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Productos</h1>
        <Link to={ROUTES.ADMIN_PRODUCT_NEW}>
          <Button variant="solid" size="md">
            Nuevo producto
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <Input
          placeholder="Buscar productos......"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {state.status === 'loading' && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {state.status === 'error' && state.error && (
        <Card className="p-8 text-center">
          <p className="text-error-600">{state.error.message}</p>
          <button
            onClick={fetchProducts}
            className="mt-2 text-sm text-primary-600 hover:underline"
          >
            Reintentar
          </button>
        </Card>
      )}

      {state.status === 'success' && filteredProducts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-neutral-600">No se encontraron productos</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image.url}
                          alt={product.image.alt}
                          className="h-10 w-10 rounded object-cover"
                        />
                        <span className="text-sm font-medium text-neutral-900">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Price amount={product.price.amount} currency={product.price.currency} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={product.isActive ? 'success' : 'default'}>
                        {product.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={ROUTES.ADMIN_PRODUCT_EDIT(product.id)}>
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteClick(product)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar eliminación"
        description={productToDelete ? `¿Estás seguro de eliminar "${productToDelete.name}"?` : ''}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Esta acción no se puede deshacer. El producto será eliminado permanentemente.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando......' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminProductsPage;
