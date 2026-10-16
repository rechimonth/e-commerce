import { useState, useEffect, useCallback } from 'react';
import { productsService } from '@/services/productsService';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product, ProductCategory } from '@/types/domain';
import type { ServiceError, PaginationState } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_LIMIT = 20;

export interface UseProductsParams {
  readonly searchTerm?: string;
  readonly category?: ProductCategory | 'all';
  readonly limit?: number;
  readonly cursor?: string | null;
  readonly page?: number;
  readonly sortBy?: 'price-asc' | 'price-desc';

export interface UseProductsResult {
  readonly products: readonly Product[];
  readonly status: AsyncStatus;
  readonly error: ServiceError | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly pagination: PaginationState | null;
  readonly nextCursor: string | null;
  readonly refetch: () => void;
}

export function useProducts(params: UseProductsParams = {}): UseProductsResult {
  const {
    searchTerm = '',
    category = 'all',
    limit = DEFAULT_LIMIT,
    cursor = null,
    page = 1,
    sortBy,
  } = params;
  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  const [products, setProducts] = useState<readonly Product[] | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<ServiceError | null>(null);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setProducts(null);
    setError(null);
    setPagination(null);
    setNextCursor(null);
    setStatus('loading');

    const fetchProducts = async () => {
      try {
        const result = await productsService.fetchProducts({
          search: debouncedSearch || undefined,
          category: category === 'all' ? undefined : category,
          limit,
          cursor,
          page,
          sortBy,
        });
        if (controller.signal.aborted) return;
        setProducts(Array.from(result.items));
        setPagination(result.pagination);
        setNextCursor(result.nextCursor);
        setStatus('success');
      } catch (e) {
        if (controller.signal.aborted) return;
        setError({
          code: 'INTERNAL_ERROR',
          message: e instanceof Error ? e.message : 'No se pudieron cargar los productos',
          details: { error: e instanceof Error ? e.message : String(e) },
        });
        setStatus('error');
      }
    };

    void fetchProducts();
    return () => controller.abort();
  }, [debouncedSearch, category, limit, cursor, page, sortBy, refreshKey]);

  return {
    products: products ?? [],
    status,
    error,
    isLoading: status === 'loading' || status === 'idle',
    isEmpty: status === 'success' && (products?.length ?? 0) === 0,
    pagination,
    nextCursor,
    refetch,
  };
}
