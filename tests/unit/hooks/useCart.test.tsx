import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from '@/hooks/useCart';
import { CartProvider } from '@/store/cart';

describe('useCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna items vacios cuando no hay items', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice.amount).toBe(0);
  });

  it('expone addItem, removeItem, updateQuantity, clearCart', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(typeof result.current.addItem).toBe('function');
    expect(typeof result.current.removeItem).toBe('function');
    expect(typeof result.current.updateQuantity).toBe('function');
    expect(typeof result.current.clearCart).toBe('function');
  });

  it('lanza error cuando se usa fuera del provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCart())).toThrow('useCart must be used within a CartProvider');
    consoleError.mockRestore();
  });

  it('agrega un item y actualiza totales', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(
        {
          id: 'p1',
          name: 'Producto test',
          price: { amount: 1000, currency: 'USD' },
          category: 'electronics',
          image: { url: 'https://img', alt: 'img', key: 'k1' },
          stock: 10,
          rating: 4,
          reviewCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin',
        },
        2,
      );
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalPrice.amount).toBe(2000);
  });

  it('elimina un item y actualiza totales', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(
        {
          id: 'p1',
          name: 'Producto test',
          price: { amount: 1000, currency: 'USD' },
          category: 'electronics',
          image: { url: 'https://img', alt: 'img', key: 'k1' },
          stock: 10,
          rating: 4,
          reviewCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin',
        },
        1,
      );
    });

    act(() => {
      result.current.removeItem('p1');
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice.amount).toBe(0);
  });

  it('actualiza cantidad y clamp a maxStock', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(
        {
          id: 'p1',
          name: 'Producto test',
          price: { amount: 1000, currency: 'USD' },
          category: 'electronics',
          image: { url: 'https://img', alt: 'img', key: 'k1' },
          stock: 5,
          rating: 4,
          reviewCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin',
        },
        3,
      );
    });

    act(() => {
      result.current.updateQuantity('p1', 10);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalItems).toBe(5);
  });

  it('limpia el carrito', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(
        {
          id: 'p1',
          name: 'Producto test',
          price: { amount: 1000, currency: 'USD' },
          category: 'electronics',
          image: { url: 'https://img', alt: 'img', key: 'k1' },
          stock: 10,
          rating: 4,
          reviewCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin',
        },
        1,
      );
    });

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
  });
});

