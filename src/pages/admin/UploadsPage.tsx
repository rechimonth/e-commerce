import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { productsService } from '@/services/productsService';
import type { Product } from '@/types/domain';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

export function UploadsPage() {
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<ServiceError | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchUploads = async () => {
      setStatus('loading');
      setError(null);
      try {
        const result = await productsService.fetchProductsAdmin({ limit: 500 });
        setProducts([...result.items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        setStatus('success');
      } catch (e) {
        setError({ code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'Error al cargar archivos' });
        setStatus('error');
      }
    };
    void fetchUploads();
  }, []);

  if (status === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === 'error' && error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-error-600">{error.message}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-900">Media del catálogo</h1>
      {products.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-neutral-600">Todavía no hay productos en el catálogo</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Vista previa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Creado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Clave S3</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img src={product.image.url} alt={product.image.alt} className="h-10 w-10 rounded object-cover" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{product.createdAt.toLocaleString('es-ES')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{product.image.key || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(product.image.url)}>Copiar URL</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default UploadsPage;
