import { useState, useEffect, useCallback } from 'react';
import { productsService } from '@/services/productsService';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product, ProductCategory } from '@/types/domain';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_LIMIT = 20;

export interface UseProductsParams {
  readonly searchTerm?: string;
  readonly category?: ProductCategory | 'all';
  readonly limit?: number;
}

export interface UseProductsResult {
  readonly products: readonly Product[];
  readonly status: AsyncStatus;
  readonly error: ServiceError | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly refetch: () => void;
}

export function useProducts(params: UseProductsParams = {}): UseProductsResult {
  const { searchTerm = '', category = 'all', limit = DEFAULT_LIMIT } = params;
  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);

  const [products, setProducts] = useState<readonly Product[] | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<ServiceError | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setProducts(null);
    setError(null);
    setStatus('loading');

    const fetchProducts = async () => {
      try {
        const result = await productsService.fetchProducts({
          search: debouncedSearch || undefined,
          category: category === 'all' ? undefined : category,
          limit,
        });

        if (controller.signal.aborted) return;

        setProducts(Array.from(result.items));
        setStatus('success');
      } catch (e) {
        if (controller.signal.aborted) return;

        const serviceError: ServiceError = {
          code: 'INTERNAL_ERROR',
          message: e instanceof Error ? e.message : 'Failed to fetch products',
          details: { error: e instanceof Error ? e.message : String(e) },
        };

        setError(serviceError);
        setStatus('error');
      }
    };

    void fetchProducts();

    return () => controller.abort();
  }, [debouncedSearch, category, limit, refreshKey]);

  const isLoading = status === 'loading' || status === 'idle';
  const isEmpty = status === 'success' && (products?.length ?? 0) === 0;

  return {
    products: products ?? [],
    status,
    error,
    isLoading,
    isEmpty,
    refetch,
  };
}
