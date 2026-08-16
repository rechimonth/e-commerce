import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { OrdersPage } from '@/pages/OrdersPage';
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

const mockOrders: Order[] = [
  {
    id: 'ord_1',
    userId: 'test-uid',
    items: [
      {
        orderId: 'ord_1',
        productId: 'p1',
        name: 'Test Product',
        price: { amount: 1000, currency: 'USD' },
        quantity: 2,
        image: { url: 'https://example.com/img.png', alt: 'Test', key: 'img-1' },
      },
    ],
    pricing: {
      subtotal: { amount: 2000, currency: 'USD' },
      tax: { amount: 0, currency: 'USD' },
      shipping: { amount: 0, currency: 'USD' },
      discount: { amount: 0, currency: 'USD' },
      total: { amount: 2000, currency: 'USD' },
    },
    status: 'pending',
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
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

vi.mock('@/services/ordersService', () => ({
  ordersService: {
    fetchUserOrders: vi.fn(),
    fetchOrder: vi.fn(),
    cancelOrder: vi.fn(),
  },
}));

function renderOrdersPage() {
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <CartProvider>
        <MemoryRouter initialEntries={['/orders']}>
          <OrdersPage />
        </MemoryRouter>
      </CartProvider>
    </AuthContext.Provider>,
  );
}

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no orders', async () => {
    vi.mocked(ordersService.fetchUserOrders).mockResolvedValue([]);

    renderOrdersPage();

    await waitFor(() => {
      expect(screen.getByText(/No tienes órdenes/i)).toBeInTheDocument();
    });
  });

  it('renders loading state initially', () => {
    vi.mocked(ordersService.fetchUserOrders).mockReturnValue(new Promise(() => {}));

    renderOrdersPage();

    expect(screen.getByText('Cargando órdenes...')).toBeInTheDocument();
  });

  it('renders orders list after load', async () => {
    vi.mocked(ordersService.fetchUserOrders).mockResolvedValue(mockOrders);

    renderOrdersPage();

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    expect(screen.getByText(/Pendiente/i)).toBeInTheDocument();
    expect(screen.getByText(/Ver detalle/i)).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    vi.mocked(ordersService.fetchUserOrders).mockRejectedValue(new Error('Network error'));

    renderOrdersPage();

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('renders order detail link with correct href', async () => {
    vi.mocked(ordersService.fetchUserOrders).mockResolvedValue(mockOrders);

    renderOrdersPage();

    const detailLink = await screen.findByRole('link', { name: /Ver detalle/i });
    expect(detailLink).toHaveAttribute('href', '/orders/ord_1');
  });
});
