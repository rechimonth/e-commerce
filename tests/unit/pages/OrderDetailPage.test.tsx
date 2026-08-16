import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { AuthContext } from '@/contexts/AuthContext';
import { CartProvider } from '@/store/cart/CartProvider';
import type { AuthContextValue } from '@/contexts/AuthContext';
import { ordersService } from '@/services/ordersService';
import type { Order } from '@/types/order';

const mockAuthValue: AuthContextValue = {
  user: {
    uid: 'test-uid',
    email: 'test@test.com',
    displayName: 'Test User',
    photoURL: null,
    role: 'customer',
    createdAt: new Date(),
    lastLoginAt: new Date(),
    preferences: { currency: 'USD', locale: 'es-MX', notifications: true },
  },
  roleState: 'customer',
  session: { uid: 'test-uid', role: 'customer', isAuthenticated: true },
  isLoading: false,
  error: null,
  signIn: () => Promise.resolve(),
  signUp: () => Promise.resolve(),
  signInWithGoogle: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
  refreshUserProfile: () => Promise.resolve(),
  clearError: () => {},
};

const mockOrder: Order = {
  id: 'ord_123',
  userId: 'test-uid',
  items: [
    {
      orderId: 'ord_123',
      productId: 'p1',
      name: 'Test Product',
      price: { amount: 1000, currency: 'USD' },
      quantity: 2,
      image: { url: 'https://example.com/img.png', alt: 'Test', key: 'img-1' },
    },
  ],
  pricing: {
    subtotal: { amount: 2000, currency: 'USD' },
    tax: { amount: 160, currency: 'USD' },
    shipping: { amount: 500, currency: 'USD' },
    discount: { amount: 0, currency: 'USD' },
    total: { amount: 2660, currency: 'USD' },
  },
  status: 'completed',
  statusHistory: [],
  shippingAddress: {
    street: 'Test St',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    country: 'Spain',
  },
  billingAddress: {
    street: 'Test St',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    country: 'Spain',
  },
  paymentMethod: 'card',
  notes: 'Entregar por la tarde',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

vi.mock('@/services/ordersService', () => ({
  ordersService: {
    fetchOrder: vi.fn(),
    fetchUserOrders: vi.fn(),
    cancelOrder: vi.fn(),
  },
}));

function renderOrderDetail(orderId = 'ord_123') {
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <CartProvider>
        <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
          <Routes>
            <Route path="/orders/:id" element={<OrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthContext.Provider>,
  );
}

describe('OrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(ordersService.fetchOrder).mockReturnValue(new Promise(() => {}));

    renderOrderDetail();

    expect(screen.getByText('Cargando pedido...')).toBeInTheDocument();
  });

  it('renders order details when loaded', async () => {
    vi.mocked(ordersService.fetchOrder).mockResolvedValue(mockOrder);

    renderOrderDetail();

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    expect(screen.getByText(/ord_123/)).toBeInTheDocument();
    expect(screen.getByText('Resumen financiero')).toBeInTheDocument();
  });

  it('renders order pricing details', async () => {
    vi.mocked(ordersService.fetchOrder).mockResolvedValue(mockOrder);

    renderOrderDetail();

    await waitFor(() => {
      expect(screen.getByText('Resumen financiero')).toBeInTheDocument();
    });

    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('Impuestos')).toBeInTheDocument();
    expect(screen.getByText('Envío')).toBeInTheDocument();
    expect(screen.getByText('Descuento')).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    vi.mocked(ordersService.fetchOrder).mockRejectedValue(new Error('Order not found'));

    renderOrderDetail('ord_999');

    await waitFor(() => {
      expect(screen.getByText(/Order not found/)).toBeInTheDocument();
    });
  });

  it('renders back link to orders list', async () => {
    vi.mocked(ordersService.fetchOrder).mockResolvedValue(mockOrder);

    renderOrderDetail();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Volver a mis órdenes/i })).toBeInTheDocument();
    });
  });
});
