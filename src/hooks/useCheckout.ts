import { useState, useCallback } from 'react';
import { checkoutService } from '@/services/checkoutService';
import type { Order, CheckoutData } from '@/types/order';
import type { CartState } from '@/types/cart';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';

export interface UseCheckoutResult {
  readonly status: AsyncStatus;
  readonly error: ServiceError | null;
  readonly order: Order | null;
  readonly isLoading: boolean;
  readonly isProcessing: boolean;
  readonly processCheckout: (
    data: CheckoutData,
    cartState: CartState,
    userId: string,
  ) => Promise<Order | null>;
}

export function useCheckout(): UseCheckoutResult {
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<ServiceError | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const processCheckout = useCallback(
    async (data: CheckoutData, cartState: CartState, userId: string) => {
      setStatus('loading');
      setError(null);

      try {
        const result = await checkoutService.processCheckout(data, cartState, userId);
        setOrder(result);
        setStatus('success');
        return result;
      } catch (e) {
        const serviceError: ServiceError = {
          code: 'INTERNAL_ERROR',
          message: e instanceof Error ? e.message : 'Failed to process checkout',
          details: { error: e instanceof Error ? e.message : String(e) },
        };
        setError(serviceError);
        setStatus('error');
        return null;
      }
    },
    [],
  );

  const isLoading = status === 'loading' || status === 'idle';

  return {
    status,
    error,
    order,
    isLoading,
    isProcessing: status === 'loading',
    processCheckout,
  };
}
