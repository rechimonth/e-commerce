import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ROUTES } from '@/constants/routes';
import { PRODUCT_CATEGORIES } from '@/types/domain';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

export function CategoriesPage() {
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<ServiceError | null>(null);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      setStatus('loading');
      setError(null);
      try {
        const { getFirebaseDb } = await import('@/infrastructure/firebase/config');
        const { collection, getDocs } = await import('firebase/firestore');
        const db = getFirebaseDb();
        const snapshot = await getDocs(collection(db, 'products'));
        const counts: Record<string, number> = {};
        snapshot.docs.forEach((doc) => {
          const cat = (doc.data() as Record<string, unknown>).category as string ?? 'action-figures';
          counts[cat] = (counts[cat] || 0) + 1;
        });

        const categoryList = PRODUCT_CATEGORIES.map((cat) => ({
          name: cat,
          count: counts[cat] || 0,
        }));
        setCategories(categoryList);
        setStatus('success');
      } catch (e) {
        setError({ code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : 'Error al cargar categorías' });
        setStatus('error');
      }
    };
    void fetchCategories();
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Categorías</h1>
        <Link to={ROUTES.ADMIN_CATEGORY_NEW}>
          <Button variant="solid" size="md">Nueva categoría</Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Productos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {categories.map((cat) => (
                <tr key={cat.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{cat.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{cat.count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link to={ROUTES.ADMIN_CATEGORY_EDIT(cat.name)}>
                      <Button variant="outline" size="sm">Editar</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default CategoriesPage;
