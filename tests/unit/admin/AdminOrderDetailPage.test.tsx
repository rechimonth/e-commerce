import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '@/contexts/AuthProvider';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminOrderDetailPage } from '@/pages/admin/OrderDetailPage';

vi.mock('@/services/ordersService', () => ({
  ordersService: {
    fetchOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
  },
}));

vi.mock('@/infrastructure/firebase/config', () => ({
  getFirebaseDb: vi.fn(() => ({ _type: 'Firestore' })),
  firebaseTryCatch: async (fn: () => Promise<unknown>) => fn(),
  _resetFirebaseForTesting: vi.fn(),
  initializeFirebase: vi.fn(),
}));

vi.mock('@/infrastructure/firebase/auth', () => ({
  observeAuthState: vi.fn(() => vi.fn()),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
  getUserProfile: vi.fn(),
}));

import { ordersService } from '@/services/ordersService';

const mockOrder = {
  id: 'order-abc123',
  userId: 'user-1',
  items: [
    {
      productId: 'p1',
      name: 'Test Product',
      price: { amount: 100, currency: 'USD' as const },
      quantity: 2,
      image: { url: '', alt: 'Test', key: '' },
      orderId: 'order-abc123',
    },
  ],
  pricing: {
    subtotal: { amount: 200, currency: 'USD' as const },
    tax: { amount: 20, currency: 'USD' as const },
    shipping: { amount: 10, currency: 'USD' as const },
    discount: { amount: 0, currency: 'USD' as const },
    total: { amount: 230, currency: 'USD' as const },
  },
  status: 'pending' as const,
  statusHistory: [
    { from: 'pending' as const, to: 'pending' as const, by: 'system', timestamp: new Date('2025-01-15') },
  ],
  shippingAddress: { street: '123 St', city: 'City', state: 'ST', zipCode: '12345', country: 'US' },
  billingAddress: { street: '123 St', city: 'City', state: 'ST', zipCode: '12345', country: 'US' },
  paymentMethod: 'card' as const,
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-01-15'),
};

describe('AdminOrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders order details when loaded', async () => {
    vi.spyOn(ordersService, 'fetchOrder').mockResolvedValue(mockOrder);

    render(
      <MemoryRouter initialEntries={['/admin/orders/order-abc123']}>
        <AuthProvider>
          <Routes>
            <Route path='/admin/orders/:id' element={<AdminOrderDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Orden #r-abc123')).toBeInTheDocument();
    });
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Pago')).toBeInTheDocument();
    expect(screen.getByText('Historial de estados')).toBeInTheDocument();
  });

  it('renders not found when order does not exist', async () => {
    vi.spyOn(ordersService, 'fetchOrder').mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={['/admin/orders/nonexistent']}>
        <AuthProvider>
          <Routes>
            <Route path='/admin/orders/:id' element={<AdminOrderDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Orden no encontrada')).toBeInTheDocument();
    });
  });

  it('renders status history when present', async () => {
    vi.spyOn(ordersService, 'fetchOrder').mockResolvedValue(mockOrder);

    render(
      <MemoryRouter initialEntries={['/admin/orders/order-abc123']}>
        <AuthProvider>
          <Routes>
            <Route path='/admin/orders/:id' element={<AdminOrderDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Historial de estados')).toBeInTheDocument();
    });
    expect(screen.getAllByText('pending').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/system/)).toBeInTheDocument();
  });
});
