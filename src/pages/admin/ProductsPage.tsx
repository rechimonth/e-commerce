import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Price } from '@/components/ui/Price';
import { productsService } from '@/services/productsService';
import { exportToCsv } from '@/utils/export';
import { ROUTES } from '@/constants/routes';
import { PRODUCT_CATEGORIES } from '@/types/domain';
import type { Product, ProductCategory } from '@/types/domain';
import type { PaginatedResult } from '@/types/api';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';
import { resolveProductImage, handleProductImageError } from '@/utils/productImage';

interface AdminProductsPageState {
  products: Product[] | null;
  status: AsyncStatus;
  error: ServiceError | null;
  pagination: PaginatedResult<Product>['pagination'] | null;
}

type StatusFilter = 'all' | 'active' | 'inactive';

export function AdminProductsPage() {
  const [state, setState] = useState<AdminProductsPageState>({
    products: null,
    status: 'loading',
    error: null,
    pagination: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    console.log('[AdminProductsPage] Firebase project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    try {
      console.log('[AdminProductsPage] Fetching products...');
      const result: PaginatedResult<Product> = await productsService.fetchProductsAdmin({
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        limit: 20,
      });
      console.log('[AdminProductsPage] Products loaded:', result.items.length);
      setState({ products: result.items as Product[], status: 'success', error: null, pagination: result.pagination });
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al cargar productos',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setState({ products: null, status: 'error', error: err, pagination: null });
    }
  }, [searchTerm, categoryFilter]);

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(displayProducts.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all([...selectedIds].map((id) => productsService.deleteProduct(id)));
      setSelectedIds(new Set());
      void fetchProducts();
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al eliminar productos',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setState((prev) => ({ ...prev, error: err }));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExport = () => {
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Nombre' },
      { key: 'price', label: 'Precio' },
      { key: 'category', label: 'Categoría' },
      { key: 'stock', label: 'Stock' },
      { key: 'isActive', label: 'Activo' },
    ];
    const rows = displayProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: `${p.price.currency} ${p.price.amount}`,
      category: p.category,
      stock: p.stock,
      isActive: p.isActive ? 'Sí' : 'No',
    }));
    exportToCsv('productos', rows, columns);
  };

  const displayProducts = state.products?.filter((p) => {
    const matchesSearch = searchTerm
      ? p.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesStatus =
      statusFilter === 'active' ? p.isActive
      : statusFilter === 'inactive' ? !p.isActive
      : true;
    return matchesSearch && matchesStatus;
  }) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Productos</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={handleExport}>
            Exportar CSV
          </Button>
          <Link to={ROUTES.ADMIN_PRODUCT_NEW}>
            <Button variant="solid" size="md">
              Nuevo producto
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            label="Categoría"
            options={[
              { value: '', label: 'Todas' },
              ...PRODUCT_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | '')}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            label="Estado"
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'active', label: 'Activos' },
              { value: 'inactive', label: 'Inactivos' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-md bg-primary-50 p-3">
          <span className="text-sm text-neutral-700">{selectedIds.size} seleccionado(s)</span>
          <Button variant="danger" size="sm" onClick={handleBulkDelete} disabled={isBulkDeleting}>
            {isBulkDeleting ? 'Eliminando...' : 'Eliminar seleccionados'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
            Cancelar selección
          </Button>
        </div>
      )}

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

      {state.status === 'success' && displayProducts.length === 0 ? (
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
                    <input
                      type="checkbox"
                      checked={displayProducts.length > 0 && selectedIds.size === displayProducts.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-neutral-300"
                    />
                  </th>
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
                {displayProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                        className="rounded border-neutral-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveProductImage(product)}
                          alt={product.image.alt}
                          className="h-10 w-10 rounded object-cover"
                         onError={handleProductImageError} />
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
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminProductsPage;
