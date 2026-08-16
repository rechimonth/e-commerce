import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCheckout } from '@/hooks/useCheckout';
import { checkoutService } from '@/services/checkoutService';

vi.mock('@/services/checkoutService', () => ({
  checkoutService: {
    processCheckout: vi.fn(),
  },
}));

describe('useCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicia en estado idle', () => {
    const { result } = renderHook(() => useCheckout());
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.order).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  it('procesa checkout exitosamente', async () => {
    const mockOrder = {
      id: 'ord-123',
      userId: 'user-1',
      items: [],
      pricing: { subtotal: { amount: 1000, currency: 'USD' }, tax: { amount: 0, currency: 'USD' }, shipping: { amount: 0, currency: 'USD' }, discount: { amount: 0, currency: 'USD' }, total: { amount: 1000, currency: 'USD' } },
      status: 'pending' as const,
      statusHistory: [],
      shippingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
      billingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
      paymentMethod: 'card',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (checkoutService.processCheckout as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrder);

    const { result } = renderHook(() => useCheckout());

    await act(async () => {
      await result.current.processCheckout(
        { shippingAddress: { street: '', city: '', state: '', zipCode: '', country: '' }, billingAddress: { street: '', city: '', state: '', zipCode: '', country: '' }, paymentMethod: 'card', notes: '' },
        { items: [], discount: { amount: 0, currency: 'USD' }, totalItems: 0, totalPrice: { amount: 0, currency: 'USD' }, lastUpdated: new Date() },
        'user-1',
      );
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current.order).toEqual(mockOrder);
    expect(result.current.error).toBeNull();
  });

  it('maneja error en checkout', async () => {
    (checkoutService.processCheckout as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Error de pago'));

    const { result } = renderHook(() => useCheckout());

    await act(async () => {
      await result.current.processCheckout(
        { shippingAddress: { street: '', city: '', state: '', zipCode: '', country: '' }, billingAddress: { street: '', city: '', state: '', zipCode: '', country: '' }, paymentMethod: 'card', notes: '' },
        { items: [], discount: { amount: 0, currency: 'USD' }, totalItems: 0, totalPrice: { amount: 0, currency: 'USD' }, lastUpdated: new Date() },
        'user-1',
      );
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('Error de pago');
  });

  it('refetch no existe en useCheckout', () => {
    const { result } = renderHook(() => useCheckout());
    expect(result.current).not.toHaveProperty('refetch');
  });
});
