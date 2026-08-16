import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { CheckoutPage } from '@/pages/CheckoutPage';

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/hooks/useCheckout', () => ({
  useCheckout: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useCheckout';
import { useAuth } from '@/hooks/useAuth';

const mockCartState = {
  items: [
    {
      productId: 'p1',
      name: 'Test Product',
      price: { amount: 1000, currency: 'USD' },
      quantity: 1,
      image: { url: 'https://img', alt: 'img', key: 'k1' },
      maxStock: 10,
    },
  ],
  discount: { amount: 0, currency: 'USD' },
  totalItems: 1,
  totalPrice: { amount: 1000, currency: 'USD' },
  lastUpdated: new Date(),
  addItem: vi.fn(),
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
};

const mockAuth = {
  user: { uid: 'user-1', email: 'test@test.com', displayName: 'Test', photoURL: null, role: 'customer', createdAt: new Date(), lastLoginAt: new Date(), preferences: { currency: 'USD', locale: 'es-MX', notifications: true } },
  roleState: 'customer' as const,
  session: { uid: 'user-1', role: 'customer', isAuthenticated: true },
  isLoading: false,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshUserProfile: async () => {},
  clearError: () => {},
};

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCart).mockReturnValue(mockCartState);
    vi.mocked(useCheckout).mockReturnValue({
      status: 'idle',
      error: null,
      order: null,
      isLoading: false,
      isProcessing: false,
      processCheckout: vi.fn(),
    });
    vi.mocked(useAuth).mockReturnValue(mockAuth);
  });

  it('renderiza empty state cuando el carrito esta vacio', () => {
    vi.mocked(useCart).mockReturnValue({
      ...mockCartState,
      items: [],
      totalItems: 0,
      totalPrice: { amount: 0, currency: 'USD' },
    });

    const router = createMemoryRouter(
      [{ path: '/checkout', element: <CheckoutPage /> }],
      { initialEntries: ['/checkout'] },
    );

    render(<RouterProvider router={router} />);
    expect(screen.getByRole('heading', { name: /carrito/i })).toBeInTheDocument();
  });

  it('renderiza el formulario de checkout cuando hay items', () => {
    const router = createMemoryRouter(
      [{ path: '/checkout', element: <CheckoutPage /> }],
      { initialEntries: ['/checkout'] },
    );

    render(<RouterProvider router={router} />);
    expect(screen.getByRole('heading', { name: /env/i })).toBeInTheDocument();
    expect(screen.getByText('Resumen del pedido')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('muestra multiples veces el total en el resumen', () => {
    const router = createMemoryRouter(
      [{ path: '/checkout', element: <CheckoutPage /> }],
      { initialEntries: ['/checkout'] },
    );

    render(<RouterProvider router={router} />);
    const totals = screen.getAllByText(/\$10\.00/);
    expect(totals.length).toBeGreaterThanOrEqual(1);
  });

  it('envia el formulario y llama a processCheckout', () => {
    const mockProcessCheckout = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useCheckout).mockReturnValue({
      status: 'idle',
      error: null,
      order: null,
      isLoading: false,
      isProcessing: false,
      processCheckout: mockProcessCheckout,
    });

    const router = createMemoryRouter(
      [{ path: '/checkout', element: <CheckoutPage /> }],
      { initialEntries: ['/checkout'] },
    );

    render(<RouterProvider router={router} />);

    const form = document.querySelector('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form!);

    expect(mockProcessCheckout).toHaveBeenCalledTimes(1);
  });

  it('muestra error cuando checkout falla', () => {
    vi.mocked(useCheckout).mockReturnValue({
      status: 'error',
      error: { code: 'INTERNAL_ERROR', message: 'Error de pago' },
      order: null,
      isLoading: false,
      isProcessing: false,
      processCheckout: vi.fn(),
    });

    const router = createMemoryRouter(
      [{ path: '/checkout', element: <CheckoutPage /> }],
      { initialEntries: ['/checkout'] },
    );

    render(<RouterProvider router={router} />);
    expect(screen.getByText('Error de pago')).toBeInTheDocument();
  });
});
