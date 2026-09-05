import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '@/contexts/AuthProvider';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminOrdersPage } from '@/pages/admin/OrdersPage';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'admin-1', email: 'admin@test.com', displayName: 'Admin', photoURL: null, role: 'admin', createdAt: new Date(), lastLoginAt: new Date(), preferences: { currency: 'USD', locale: 'es-MX', notifications: true } },
    roleState: 'admin', session: { uid: 'admin-1', role: 'admin', isAuthenticated: true }, isLoading: false, error: null,
    signIn: vi.fn(), signUp: vi.fn(), signInWithGoogle: vi.fn(), signOut: vi.fn(), refreshUserProfile: vi.fn(), clearError: vi.fn(),
  }),
}));
vi.mock('@/services/ordersService', () => ({ ordersService: { fetchAllOrders: vi.fn(), updateOrderStatus: vi.fn() } }));
vi.mock('@/infrastructure/firebase/config', () => ({ getFirebaseDb: vi.fn(() => ({ _type: 'Firestore' })), firebaseTryCatch: async (fn: () => Promise<unknown>) => fn(), _resetFirebaseForTesting: vi.fn(), initializeFirebase: vi.fn() }));
vi.mock('@/infrastructure/firebase/auth', () => ({ observeAuthState: vi.fn(() => vi.fn()), signInWithEmail: vi.fn(), signUpWithEmail: vi.fn(), signInWithGoogle: vi.fn(), signOutUser: vi.fn(), getUserProfile: vi.fn() }));

import { ordersService } from '@/services/ordersService';

const mockOrder = {
  id: 'order-1', userId: 'user-1',
  items: [{ productId: 'p1', name: 'Test', price: { amount: 100, currency: 'USD' as const }, quantity: 1, image: { url: '', alt: 'Test', key: '' }, orderId: 'order-1' }],
  pricing: { subtotal: { amount: 100, currency: 'USD' as const }, tax: { amount: 10, currency: 'USD' as const }, shipping: { amount: 5, currency: 'USD' as const }, discount: { amount: 0, currency: 'USD' as const }, total: { amount: 115, currency: 'USD' as const } },
  status: 'pending' as const,
  statusHistory: [{ from: 'pending' as const, to: 'pending' as const, by: 'system', timestamp: new Date() }],
  shippingAddress: { street: '123 St', city: 'City', state: 'ST', zipCode: '12345', country: 'US' },
  billingAddress: { street: '123 St', city: 'City', state: 'ST', zipCode: '12345', country: 'US' },
  paymentMethod: 'card' as const, createdAt: new Date('2025-01-15'), updatedAt: new Date('2025-01-15'),
};

describe('AdminOrdersPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders orders in table', async () => {
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([mockOrder]);
    render(<MemoryRouter initialEntries={['/admin/orders']}><AuthProvider><AdminOrdersPage /></AuthProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/order-1/i)).toBeInTheDocument());
    const row = screen.getByText(/order-1/i).closest('tr');
    if (!row) throw new Error('Row not found');
    const actionButtons = within(row).getAllByRole('button');
    await userEvent.click(actionButtons[0]!);
    expect(screen.getByRole('link', { name: /ver detalle/i })).toBeInTheDocument();
  });

  it('shows empty state when no orders', async () => {
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([]);
    render(<MemoryRouter initialEntries={['/admin/orders']}><AuthProvider><AdminOrdersPage /></AuthProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/no se encontraron órdenes/i)).toBeInTheDocument());
  });

  it('filters orders by status', async () => {
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([mockOrder]);
    render(<MemoryRouter initialEntries={['/admin/orders']}><AuthProvider><AdminOrdersPage /></AuthProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/order-1/i)).toBeInTheDocument());
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[0]!, 'processing');
    expect(ordersService.fetchAllOrders).toHaveBeenCalledWith({ status: 'processing', limit: 50 });
  });

  it('changes order status', async () => {
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([mockOrder]);
    vi.mocked(ordersService.updateOrderStatus).mockResolvedValue({ ...mockOrder, status: 'processing' });
    render(<MemoryRouter initialEntries={['/admin/orders']}><AuthProvider><AdminOrdersPage /></AuthProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/order-1/i)).toBeInTheDocument());
    const row = screen.getByText(/order-1/i).closest('tr');
    if (!row) throw new Error('Row not found');
    const statusSelect = within(row).getByRole('combobox');
    await userEvent.selectOptions(statusSelect, 'processing');
    expect(ordersService.updateOrderStatus).toHaveBeenCalledWith('order-1', 'processing', 'admin-1');
  });
});
