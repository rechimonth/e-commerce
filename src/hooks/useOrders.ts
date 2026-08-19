import { useState, useEffect, useCallback } from 'react';
import { ordersService } from '@/services/ordersService';
import type { Order } from '@/types/order';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

export interface UseOrdersResult {
  readonly orders: readonly Order[];
  readonly status: AsyncStatus;
  readonly error: ServiceError | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly refetch: () => void;
}

export function useOrders(userId: string): UseOrdersResult {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<ServiceError | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setError(null);
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    setOrders([]);
    setError(null);
    setStatus('loading');

    const fetchOrders = async () => {
      try {
        const result = await ordersService.fetchUserOrders(userId);
        if (controller.signal.aborted) return;
        setOrders(result);
        setStatus('success');
      } catch (e) {
        if (controller.signal.aborted) return;
        const serviceError: ServiceError = {
          code: 'INTERNAL_ERROR',
          message: e instanceof Error ? e.message : 'Failed to fetch orders',
          details: { error: e instanceof Error ? e.message : String(e) },
        };
        setError(serviceError);
        setStatus('error');
      }
    };

    void fetchOrders();
    return () => controller.abort();
  }, [userId, refreshKey]);

  const isLoading = status === 'loading' || status === 'idle';
  const isEmpty = status === 'success' && (orders?.length ?? 0) === 0;

  return {
    orders: orders ?? [],
    status,
    error,
    isLoading,
    isEmpty,
    refetch,
  };
}

