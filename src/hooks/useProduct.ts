import { useState, useEffect, useCallback } from 'react';
import { productsService } from '@/services/productsService';
import type { Product } from '@/types/domain';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

export interface UseProductResult {
  readonly product: Product | null;
  readonly status: AsyncStatus;
  readonly error: ServiceError | null;
  readonly isLoading: boolean;
  readonly refetch: () => void;
}

export function useProduct(id: string): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<ServiceError | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError(null);

    const fetchProduct = async () => {
      try {
        const result = await productsService.fetchProduct(id);

        if (controller.signal.aborted) return;

        if (result) {
          setProduct(result);
          setStatus('success');
        } else {
          setProduct(null);
          setError({
            code: 'NOT_FOUND',
            message: `Producto ${id} no encontrado`,
          });
          setStatus('error');
        }
      } catch (e) {
        if (controller.signal.aborted) return;

        const serviceError: ServiceError = {
          code: 'INTERNAL_ERROR',
          message: e instanceof Error ? e.message : 'Failed to fetch product',
          details: { error: e instanceof Error ? e.message : String(e) },
        };

        setError(serviceError);
        setStatus('error');
      }
    };

    void fetchProduct();

    return () => controller.abort();
  }, [id, refreshKey]);

  return {
    product,
    status,
    error,
    isLoading: status === 'loading' || status === 'idle',
    refetch,
  };
}
