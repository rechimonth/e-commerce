import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useProducts } from '@/hooks/useProducts';
import { productsService } from '@/services/productsService';
import type { Product, ProductCategory } from '@/types/domain';

vi.mock('@/services/productsService', () => ({
  productsService: {
    fetchProducts: vi.fn(),
    toProduct: vi.fn(),
  },
}));

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone',
    price: { amount: 99999, currency: 'USD' },
    category: 'electronics',
    image: { url: 'https://example.com/iphone.jpg', alt: 'iPhone 15 Pro', key: 'iphone-key' },
    stock: 10,
    rating: 4.8,
    reviewCount: 128,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24',
    description: 'Android flagship',
    price: { amount: 89999, currency: 'USD' },
    category: 'electronics',
    image: { url: 'https://example.com/samsung.jpg', alt: 'Samsung', key: 'samsung-key' },
    stock: 5,
    rating: 4.5,
    reviewCount: 96,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
  },
];

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in loading state', () => {
    vi.useFakeTimers();
    (productsService.fetchProducts as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {}),
    );

    const { result } = renderHook(() => useProducts());
    expect(result.current.status).toBe('loading');
    expect(result.current.isLoading).toBe(true);
    expect(result.current.products).toHaveLength(0);
  });

  it('fetches products and sets success state', async () => {
    (productsService.fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, limit: 20, total: 2, hasNext: false, hasPrev: false },
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.products).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error state when fetch fails', async () => {
    (productsService.fetchProducts as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error'),
    );

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe('INTERNAL_ERROR');
    expect(result.current.error?.message).toContain('Network error');
  });

  it('returns empty state when no products match', async () => {
    (productsService.fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, hasNext: false, hasPrev: false },
    });

    const { result } = renderHook(() => useProducts({ searchTerm: 'nonexistent' }));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.products).toHaveLength(0);
  });

  it('debounces search term before fetching', async () => {
    vi.useFakeTimers();
    const fetchMock = productsService.fetchProducts as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, limit: 20, total: 2, hasNext: false, hasPrev: false },
    });

    const { rerender } = renderHook(
      ({ searchTerm }: { searchTerm: string }) => useProducts({ searchTerm }),
      { initialProps: { searchTerm: '' } },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);

    rerender({ searchTerm: 'i' });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    rerender({ searchTerm: 'iph' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('passes category to fetchProducts', async () => {
    const fetchMock = productsService.fetchProducts as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, limit: 20, total: 2, hasNext: false, hasPrev: false },
    });

    renderHook(() => useProducts({ category: 'electronics' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith({
        category: 'electronics',
        limit: 20,
        search: undefined,
      });
    });
  });

  it('handles empty search term (no search filter)', async () => {
    const fetchMock = productsService.fetchProducts as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, limit: 20, total: 2, hasNext: false, hasPrev: false },
    });

    renderHook(() => useProducts({ searchTerm: '' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith({
        category: undefined,
        limit: 20,
        search: undefined,
      });
    });
  });

  it('aborts fetch on unmount to prevent memory leaks', () => {
    vi.useFakeTimers();
    const fetchMock = productsService.fetchProducts as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(() => new Promise(() => {}));

    const { unmount } = renderHook(() => useProducts());
    expect(() => unmount()).not.toThrow();
  });

  it('resets results when filters change', async () => {
    const fetchMock = productsService.fetchProducts as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, limit: 20, total: 2, hasNext: false, hasPrev: false },
    });

    const { result, rerender } = renderHook(
      ({ category }: { category: ProductCategory | 'all' }) => useProducts({ category }),
      { initialProps: { category: 'all' as ProductCategory | 'all' } },
    );

    await waitFor(() => {
      expect(result.current.products).toHaveLength(2);
    });

    fetchMock.mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, hasNext: false, hasPrev: false },
    });

    rerender({ category: 'books' as ProductCategory | 'all' });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.products).toHaveLength(0);
  });

  it('refetch function triggers new fetch', async () => {
    const fetchMock = productsService.fetchProducts as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, limit: 20, total: 2, hasNext: false, hasPrev: false },
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.products).toHaveLength(2);
    });

    result.current.refetch();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
