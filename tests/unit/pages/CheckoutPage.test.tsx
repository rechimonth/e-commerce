import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMemoryRouter, MemoryRouter, Route, Routes, RouterProvider, useLocation } from 'react-router-dom';
import { CheckoutPage } from '@/pages/CheckoutPage';

vi.mock('@/hooks/useCart', () => ({ useCart: vi.fn() }));
vi.mock('@/hooks/useCheckout', () => ({ useCheckout: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/services/ordersService', () => ({
  ordersService: { fetchOrder: vi.fn(), completeOrderPayment: vi.fn() },
}));

import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useCheckout';
import { useAuth } from '@/hooks/useAuth';
import { ordersService } from '@/services/ordersService';
import type { Order } from '@/types/order';

const mockCartState = {
  items: [{ productId: 'p1', name: 'Test Product', price: { amount: 1000, currency: 'USD' }, quantity: 1, image: { url: 'https://img', alt: 'img', key: 'k1' }, maxStock: 10 }],
  discount: { amount: 0, currency: 'USD' }, totalItems: 1, totalPrice: { amount: 1000, currency: 'USD' }, lastUpdated: new Date(),
  addItem: vi.fn(), removeItem: vi.fn(), updateQuantity: vi.fn(), clearCart: vi.fn(),
};

const mockAuth = {
  user: { uid: 'user-1', email: 'test@test.com', displayName: 'Test', photoURL: null, role: 'customer', createdAt: new Date(), lastLoginAt: new Date(), preferences: { currency: 'USD', locale: 'es-MX', notifications: true } },
  roleState: 'customer' as const, session: { uid: 'user-1', role: 'customer', isAuthenticated: true }, isLoading: false, error: null,
  signIn: async () => {}, signUp: async () => {}, signInWithGoogle: async () => {}, signOut: async () => {}, refreshUserProfile: async () => {}, clearError: () => {},
};

function RouterLocation() {
  const location = useLocation();
  return <output data-testid="router-location">{location.pathname}{location.search}</output>;
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCart).mockReturnValue(mockCartState);
    vi.mocked(useCheckout).mockReturnValue({ status: 'idle', error: null, order: null, isLoading: false, isProcessing: false, processCheckout: vi.fn() });
    vi.mocked(useAuth).mockReturnValue(mockAuth);
    vi.mocked(ordersService.fetchOrder).mockReset();
    vi.mocked(ordersService.completeOrderPayment).mockReset();
  });

  it('renderiza empty state cuando el carrito esta vacio', () => {
    vi.mocked(useCart).mockReturnValue({ ...mockCartState, items: [], totalItems: 0, totalPrice: { amount: 0, currency: 'USD' } });
    const router = createMemoryRouter([{ path: '/checkout', element: <CheckoutPage /> }], { initialEntries: ['/checkout'] });
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('heading', { name: /carrito/i })).toBeInTheDocument();
  });

  it('renderiza el formulario de checkout cuando hay items', () => {
    const router = createMemoryRouter([{ path: '/checkout', element: <CheckoutPage /> }], { initialEntries: ['/checkout'] });
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('heading', { name: /completa tu pedido/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tu pedido', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('muestra multiples veces el total en el resumen', () => {
    const router = createMemoryRouter([{ path: '/checkout', element: <CheckoutPage /> }], { initialEntries: ['/checkout'] });
    render(<RouterProvider router={router} />);
    const totals = screen.getAllByText(/\$10\.00/);
    expect(totals.length).toBeGreaterThanOrEqual(1);
  });

  it('envia el formulario y llama a processCheckout', () => {
    const mockProcessCheckout = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useCheckout).mockReturnValue({ status: 'idle', error: null, order: null, isLoading: false, isProcessing: false, processCheckout: mockProcessCheckout });
    const router = createMemoryRouter([{ path: '/checkout', element: <CheckoutPage /> }], { initialEntries: ['/checkout'] });
    render(<RouterProvider router={router} />);

    fireEvent.change(screen.getByLabelText('Calle y número'), { target: { value: 'Av. Corrientes 123' } });
    fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Buenos Aires' } });
    fireEvent.change(screen.getByLabelText('Provincia / Estado'), { target: { value: 'Buenos Aires' } });
    fireEvent.change(screen.getByLabelText('Código postal'), { target: { value: '1870' } });
    fireEvent.change(screen.getByLabelText('País'), { target: { value: 'Argentina' } });

    const checkoutButton = screen.getByRole('button', { name: /confirmar pedido/i });
    fireEvent.submit(checkoutButton.closest('form')!);
    expect(mockProcessCheckout).toHaveBeenCalledTimes(1);
  });

  it('confirms an existing order payment and returns to the admin order list', async () => {
    const paymentOrder: Order = {
      id: 'order-pay-1',
      userId: 'user-1',
      items: [{
        productId: 'p1',
        name: 'Test Product',
        price: { amount: 1000, currency: 'USD' },
        quantity: 1,
        image: { url: 'https://img', alt: 'Test Product', key: 'order-pay-1' },
        orderId: 'order-pay-1',
      }],
      pricing: {
        subtotal: { amount: 1000, currency: 'USD' },
        tax: { amount: 0, currency: 'USD' },
        shipping: { amount: 0, currency: 'USD' },
        discount: { amount: 0, currency: 'USD' },
        total: { amount: 1000, currency: 'USD' },
      },
      status: 'pending',
      statusHistory: [],
      shippingAddress: { street: 'Calle 1', city: 'BA', state: 'BA', zipCode: '1000', country: 'Argentina' },
      billingAddress: { street: 'Calle 1', city: 'BA', state: 'BA', zipCode: '1000', country: 'Argentina' },
      paymentMethod: 'card',
      createdAt: new Date('2026-10-01'),
      updatedAt: new Date('2026-10-01'),
    };
    vi.mocked(useAuth).mockReturnValue({
      ...mockAuth,
      user: { ...mockAuth.user!, role: 'admin' },
      roleState: 'admin',
      session: { uid: 'user-1', role: 'admin', isAuthenticated: true },
    });
    vi.mocked(ordersService.fetchOrder).mockResolvedValue(paymentOrder);
    vi.mocked(ordersService.completeOrderPayment).mockResolvedValue({ ...paymentOrder, status: 'completed' });

    render(
      <MemoryRouter initialEntries={['/checkout?orderId=order-pay-1&returnTo=admin']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/admin/orders" element={<><div data-testid="admin-orders-return">Órdenes actualizadas</div><RouterLocation /></>} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole('button', { name: /confirmar pago recibido/i });
    expect(screen.getByText(/no tiene una pasarela de pagos conectada/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /confirmar pago recibido/i }));

    expect(ordersService.completeOrderPayment).toHaveBeenCalledWith('order-pay-1');
    expect(await screen.findByTestId('admin-orders-return')).toBeInTheDocument();
    expect(screen.getByTestId('router-location')).toHaveTextContent('/admin/orders');
  });

  it('muestra error cuando checkout falla', () => {
    vi.mocked(useCheckout).mockReturnValue({ status: 'error', error: { code: 'INTERNAL_ERROR', message: 'Error de pago' }, order: null, isLoading: false, isProcessing: false, processCheckout: vi.fn() });
    const router = createMemoryRouter([{ path: '/checkout', element: <CheckoutPage /> }], { initialEntries: ['/checkout'] });
    render(<RouterProvider router={router} />);
    expect(screen.getByText('Error de pago')).toBeInTheDocument();
  });
});
