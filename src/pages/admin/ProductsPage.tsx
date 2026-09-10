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
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    try {
      const result: PaginatedResult<Product> = await productsService.fetchProductsAdmin({
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        limit: 20,
      });
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
    if (checked) setSelectedIds(new Set(displayProducts.map((p) => p.id)));
    else setSelectedIds(new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all([...selectedIds].map((id) => productsService.activateProduct(id)));
      setSelectedIds(new Set());
      void fetchProducts();
    } catch (e) {
      const err = {
        code: 'INTERNAL_ERROR' as const,
        message: e instanceof Error ? e.message : 'Error al activar productos',
        details: { error: e instanceof Error ? e.message : String(e) },
      } as const;
      setState((prev) => ({ ...prev, error: err }));
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all([...selectedIds].map((id) => productsService.deactivateProduct(id)));
      setSelectedIds(new Set());
      void fetchProducts();
    } catch (e) {
      const err = {
        code: 'INTERNAL_ERROR' as const,
        message: e instanceof Error ? e.message : 'Error al desactivar productos',
        details: { error: e instanceof Error ? e.message : String(e) },
      } as const;
      setState((prev) => ({ ...prev, error: err }));
    }
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
    const matchesSearch = searchTerm ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    const matchesStatus = statusFilter === 'active' ? p.isActive : statusFilter === 'inactive' ? !p.isActive : true;
    return matchesSearch && matchesStatus;
  }) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="cyber-kicker">INVENTORY GRID</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Productos</h1>
          <p className="mt-1 text-sm text-slate-400">Gestiona catálogo, stock y disponibilidad desde la consola.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={handleExport}>Exportar CSV</Button>
          <Link to={ROUTES.ADMIN_PRODUCT_NEW}><Button variant="solid" size="md">Nuevo producto</Button></Link>
        </div>
      </div>

      <Card className="cyber-card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_12rem_10rem] md:items-end">
          <Input placeholder="Buscar productos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Select label="Categoría" options={[{ value: '', label: 'Todas' }, ...PRODUCT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))]} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | '')} />
          <Select label="Estado" options={[{ value: 'all', label: 'Todos' }, { value: 'active', label: 'Activos' }, { value: 'inactive', label: 'Inactivos' }]} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} />
        </div>
      </Card>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-3">
          <span className="text-sm font-semibold text-slate-200">{selectedIds.size} seleccionado(s)</span>
          <Button variant="solid" size="sm" onClick={handleBulkActivate} className="bg-green-600 text-white hover:bg-green-500">Activar</Button>
          <Button variant="solid" size="sm" onClick={handleBulkDeactivate} className="bg-amber-500 text-slate-950 hover:bg-amber-400">Desactivar</Button>
          <Button variant="danger" size="sm" onClick={handleBulkDelete} disabled={isBulkDeleting}>{isBulkDeleting ? 'Eliminando...' : 'Eliminar seleccionados'}</Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>Cancelar selección</Button>
        </div>
      )}

      {state.status === 'loading' && <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}

      {state.status === 'error' && state.error && (
        <Card className="cyber-card p-8 text-center"><p className="font-semibold text-red-300">{state.error.message}</p><button onClick={fetchProducts} className="mt-2 text-sm font-semibold text-cyan-300 hover:underline">Reintentar</button></Card>
      )}

      {state.status === 'success' && displayProducts.length === 0 ? (
        <Card className="cyber-card p-8 text-center"><p className="text-slate-400">No se encontraron productos</p></Card>
      ) : (
        <Card className="cyber-card p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead><tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-cyan-200/80"><input type="checkbox" checked={displayProducts.length > 0 && selectedIds.size === displayProducts.length} onChange={(e) => handleSelectAll(e.target.checked)} className="rounded border-cyan-300/30 bg-slate-950" /></th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-cyan-200/80">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-cyan-200/80">Precio</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-cyan-200/80">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-cyan-200/80">Categoría</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-cyan-200/80">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-cyan-200/80">Acciones</th>
              </tr></thead>
              <tbody className="divide-y divide-cyan-300/10">
                {displayProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.has(product.id)} onChange={(e) => handleSelectOne(product.id, e.target.checked)} className="rounded border-cyan-300/30 bg-slate-950" /></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><img src={resolveProductImage(product)} alt={product.image.alt} className="h-11 w-11 rounded-lg border border-cyan-300/15 object-cover" onError={handleProductImageError} /><span className="text-sm font-semibold text-slate-100">{product.name}</span></div></td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-200"><Price amount={product.price.amount} currency={product.price.currency} /></td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-300">{product.stock}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">{product.category}</td>
                    <td className="whitespace-nowrap px-6 py-4"><Badge variant={product.isActive ? 'success' : 'default'} size="md" className="font-bold">{product.isActive ? 'Activo' : 'Inactivo'}</Badge></td>
                    <td className="whitespace-nowrap px-6 py-4 text-right"><div className="flex items-center justify-end gap-2"><Link to={ROUTES.ADMIN_PRODUCT_EDIT(product.id)}><Button variant="outline" size="sm">Editar</Button></Link><Button variant="danger" size="sm" onClick={() => handleDeleteClick(product)}>Eliminar</Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar eliminación" description={productToDelete ? `¿Estás seguro de eliminar "${productToDelete.name}"?` : ''} size="sm" variant="admin">
        <div className="space-y-4 pt-2"><p className="text-sm text-slate-300">Esta acción no se puede deshacer. El producto será eliminado permanentemente.</p><div className="flex justify-end gap-3"><Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>Cancelar</Button><Button variant="danger" size="sm" onClick={handleConfirmDelete} disabled={isDeleting}>{isDeleting ? 'Eliminando...' : 'Eliminar'}</Button></div></div>
      </Modal>
    </div>
  );
}

export default AdminProductsPage;
