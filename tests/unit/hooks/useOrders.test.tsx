import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOrders } from '@/hooks/useOrders';
import { ordersService } from '@/services/ordersService';

vi.mock('@/services/ordersService', () => ({
  ordersService: {
    fetchUserOrders: vi.fn(),
  },
}));

describe('useOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna estado inicial vacio', () => {
    const { result } = renderHook(() => useOrders('user-1'));
    expect(result.current.orders).toEqual([]);
    expect(result.current.status).toBe('loading');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isEmpty).toBe(false);
  });

  it('fetch y setea ordenes', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        userId: 'user-1',
        items: [],
        pricing: { subtotal: { amount: 0, currency: 'USD' }, tax: { amount: 0, currency: 'USD' }, shipping: { amount: 0, currency: 'USD' }, discount: { amount: 0, currency: 'USD' }, total: { amount: 0, currency: 'USD' } },
        status: 'pending',
        statusHistory: [],
        shippingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
        billingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
        paymentMethod: 'card',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    (ordersService.fetchUserOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrders);

    const { result } = renderHook(() => useOrders('user-1'));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.orders).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEmpty).toBe(false);
  });

  it('maneja error en fetch', async () => {
    (ordersService.fetchUserOrders as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useOrders('user-1'));

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('Network error');
  });

  it('muestra empty state cuando no hay ordenes', async () => {
    (ordersService.fetchUserOrders as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const { result } = renderHook(() => useOrders('user-1'));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.orders).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });

  it('refetch dispara nuevo fetch', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        userId: 'user-1',
        items: [],
        pricing: { subtotal: { amount: 0, currency: 'USD' }, tax: { amount: 0, currency: 'USD' }, shipping: { amount: 0, currency: 'USD' }, discount: { amount: 0, currency: 'USD' }, total: { amount: 0, currency: 'USD' } },
        status: 'pending',
        statusHistory: [],
        shippingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
        billingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
        paymentMethod: 'card',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    (ordersService.fetchUserOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrders);

    const { result } = renderHook(() => useOrders('user-1'));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(ordersService.fetchUserOrders).toHaveBeenCalledTimes(2);
    });
  });
});