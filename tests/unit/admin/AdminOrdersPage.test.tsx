import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '@/contexts/AuthProvider';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminOrdersPage } from '@/pages/admin/OrdersPage';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'admin-1', email: 'admin@test.com', displayName: 'Admin', photoURL: null, role: 'admin', createdAt: new Date(), lastLoginAt: new Date(), preferences: { currency: 'USD', locale: 'es-MX', notifications: true } }, roleState: 'admin', session: { uid: 'admin-1', role: 'admin', isAuthenticated: true }, isLoading: false, error: null, signIn: vi.fn(), signUp: vi.fn(), signInWithGoogle: vi.fn(), signOut: vi.fn(), refreshUserProfile: vi.fn(), clearError: vi.fn() }) }));
vi.mock('@/services/ordersService', () => ({ ordersService: { fetchAllOrders: vi.fn(), updateOrderStatus: vi.fn(), deleteOrders: vi.fn() } }));
vi.mock('@/infrastructure/firebase/config', () => ({ getFirebaseDb: vi.fn(() => ({ _type: 'Firestore' })), firebaseTryCatch: async (fn: () => Promise<unknown>) => fn(), _resetFirebaseForTesting: vi.fn(), initializeFirebase: vi.fn() }));
vi.mock('@/infrastructure/firebase/auth', () => ({ observeAuthState: vi.fn(() => vi.fn()), signInWithEmail: vi.fn(), signUpWithEmail: vi.fn(), signInWithGoogle: vi.fn(), signOutUser: vi.fn(), getUserProfile: vi.fn() }));

import { ordersService } from '@/services/ordersService';

const mockOrder = { id: 'order-1', userId: 'user-1', items: [{ productId: 'p1', name: 'Test', price: { amount: 100, currency: 'USD' as const }, quantity: 1, image: { url: '', alt: 'Test', key: '' }, orderId: 'order-1' }], pricing: { subtotal: { amount: 100, currency: 'USD' as const }, tax: { amount: 10, currency: 'USD' as const }, shipping: { amount: 5, currency: 'USD' as const }, discount: { amount: 0, currency: 'USD' as const }, total: { amount: 115, currency: 'USD' as const } }, status: 'pending' as const, statusHistory: [{ from: 'pending' as const, to: 'pending' as const, by: 'system', timestamp: new Date() }], shippingAddress: { street: '123 St', city: 'City', state: 'ST', zipCode: '12345', country: 'US' }, billingAddress: { street: '123 St', city: 'City', state: 'ST', zipCode: '12345', country: 'US' }, paymentMethod: 'card' as const, createdAt: new Date('2025-01-15'), updatedAt: new Date('2025-01-15') };

describe('AdminOrdersPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('renders orders in table', async () => {
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([mockOrder]);
    render(<MemoryRouter initialEntries={['/admin/orders']}><AuthProvider><AdminOrdersPage /></AuthProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/order-1/i)).toBeInTheDocument());
    const row = screen.getByText(/order-1/i).closest('tr'); if (!row) throw new Error('Row not found');
    await userEvent.click(within(row).getAllByRole('button')[0]!);
    expect(screen.getByRole('link', { name: /ver detalle/i })).toBeInTheDocument();
  });
  it('removes print label while preserving all remaining row actions', async () => {
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([mockOrder]);
    render(<MemoryRouter initialEntries={['/admin/orders']}><AuthProvider><AdminOrdersPage /></AuthProvider></MemoryRouter>);
    const row = await screen.findByText(/order-1/i).then((element) => element.closest('tr'));
    if (!row) throw new Error('Row not found');

    await userEvent.click(within(row).getByTestId('order-actions-trigger'));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver detalle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /editar orden/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eliminar orden/i })).toBeInTheDocument();
    expect(screen.queryByText(/imprimir etiqueta/i)).not.toBeInTheDocument();
  });

  it('filters orders by ID, user, exact date, and total range', async () => {
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([mockOrder]);
    render(<MemoryRouter initialEntries={['/admin/orders']}><AuthProvider><AdminOrdersPage /></AuthProvider></MemoryRouter>);
    await screen.findByText(/order-1/i);

    fireEvent.change(screen.getByLabelText('Filtrar por ID'), { target: { value: 'order-1' } });
    fireEvent.change(screen.getByLabelText('Filtrar por usuario'), { target: { value: 'user-1' } });
    fireEvent.change(screen.getByLabelText('Filtrar por fecha'), { target: { value: '2025-01-15' } });
    fireEvent.change(screen.getByLabelText('Total mínimo'), { target: { value: '1.00' } });
    fireEvent.change(screen.getByLabelText('Total máximo'), { target: { value: '2.00' } });
    expect(screen.getByText(/order-1/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Total mínimo'), { target: { value: '2.00' } });
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    expect(screen.getByText(/order-1/i)).toBeInTheDocument();
  });

  it('shows empty state when no orders', async () => {
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([]);
    render(<MemoryRouter initialEntries={['/admin/orders']}><AuthProvider><AdminOrdersPage /></AuthProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/No hay órdenes registradas/i)).toBeInTheDocument());
  });
  it('filters orders by status', async () => {
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([mockOrder]);
    render(<MemoryRouter initialEntries={['/admin/orders']}><AuthProvider><AdminOrdersPage /></AuthProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/order-1/i)).toBeInTheDocument());
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0]!, 'processing');
    expect(ordersService.fetchAllOrders).toHaveBeenCalledWith({ status: 'processing' });
  });
  it('deletes selected orders only after the API confirms success', async () => {
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([mockOrder]);
    vi.mocked(ordersService.deleteOrders).mockResolvedValue(['order-1']);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<MemoryRouter initialEntries={['/admin/orders']}><AuthProvider><AdminOrdersPage /></AuthProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/order-1/i)).toBeInTheDocument());

    await userEvent.click(screen.getAllByRole('checkbox')[0]!);
    await userEvent.click(screen.getByRole('button', { name: /Eliminar seleccionadas/i }));

    expect(ordersService.deleteOrders).toHaveBeenCalledWith(['order-1']);
    await waitFor(() => expect(screen.getByText(/No hay órdenes registradas/i)).toBeInTheDocument());
    confirmSpy.mockRestore();
  });

  it('keeps the order visible when the server rejects deletion', async () => {
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([mockOrder]);
    vi.mocked(ordersService.deleteOrders).mockRejectedValue(new Error('No se pudo eliminar'));
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<MemoryRouter initialEntries={['/admin/orders']}><AuthProvider><AdminOrdersPage /></AuthProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/order-1/i)).toBeInTheDocument());

    await userEvent.click(screen.getAllByRole('checkbox')[0]!);
    await userEvent.click(screen.getByRole('button', { name: /Eliminar seleccionadas/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo eliminar');
    expect(screen.getByText(/order-1/i)).toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it('deletes an individual order from the row actions menu', async () => {
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([mockOrder]);
    vi.mocked(ordersService.deleteOrders).mockResolvedValue(['order-1']);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<MemoryRouter initialEntries={['/admin/orders']}><AuthProvider><AdminOrdersPage /></AuthProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/order-1/i)).toBeInTheDocument());

    const row = screen.getByText(/order-1/i).closest('tr');
    if (!row) throw new Error('Row not found');
    await userEvent.click(within(row).getAllByRole('button')[0]!);
    await userEvent.click(screen.getByRole('button', { name: /Eliminar orden/i }));

    expect(ordersService.deleteOrders).toHaveBeenCalledWith(['order-1']);
    await waitFor(() => expect(screen.getByText(/No hay órdenes registradas/i)).toBeInTheDocument());
    confirmSpy.mockRestore();
  });

  it('changes order status', async () => {
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([mockOrder]);
    vi.mocked(ordersService.updateOrderStatus).mockResolvedValue({ ...mockOrder, status: 'processing' });
    render(<MemoryRouter initialEntries={['/admin/orders']}><AuthProvider><AdminOrdersPage /></AuthProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/order-1/i)).toBeInTheDocument());
    const row = screen.getByText(/order-1/i).closest('tr'); if (!row) throw new Error('Row not found');
    await userEvent.selectOptions(within(row).getByRole('combobox'), 'processing');
    expect(ordersService.updateOrderStatus).toHaveBeenCalledWith('order-1', 'processing');
  });
});