import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminOrdersPage } from '@/pages/admin/OrdersPage';

vi.mock('@/services/ordersService', () => ({
  ordersService: {
    fetchAllOrders: vi.fn(),
    updateOrderStatus: vi.fn(),
  },
}));

import { ordersService } from '@/services/ordersService';

const mockOrder = {
  id: 'order-1',
  userId: 'user-1',
  items: [
    { productId: 'p1', name: 'Test', price: { amount: 100, currency: 'USD' as const }, quantity: 1, image: { url: '', alt: 'Test', key: '' }, orderId: 'order-1' },
  ],
  pricing: {
    subtotal: { amount: 100, currency: 'USD' as const },
    tax: { amount: 10, currency: 'USD' as const },
    shipping: { amount: 5, currency: 'USD' as const },
    discount: { amount: 0, currency: 'USD' as const },
    total: { amount: 115, currency: 'USD' as const },
  },
  status: 'pending' as const,
  statusHistory: [
    { from: 'pending' as const, to: 'pending' as const, by: 'system', timestamp: new Date() },
  ],
  shippingAddress: { street: '123 St', city: 'City', state: 'ST', zipCode: '12345', country: 'US' },
  billingAddress: { street: '123 St', city: 'City', state: 'ST', zipCode: '12345', country: 'US' },
  paymentMethod: 'card' as const,
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-01-15'),
};

describe('AdminOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders orders in table', async () => {
    vi.spyOn(ordersService, 'fetchAllOrders').mockResolvedValue([mockOrder]);

    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <AdminOrdersPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/order-1/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Ver detalle')).toBeInTheDocument();
  });

  it('shows empty state when no orders', async () => {
    vi.spyOn(ordersService, 'fetchAllOrders').mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <AdminOrdersPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('No se encontraron órdenes')).toBeInTheDocument();
    });
  });

  it('filters orders by status', async () => {
    vi.spyOn(ordersService, 'fetchAllOrders').mockResolvedValue([mockOrder]);

    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <AdminOrdersPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/order-1/i)).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[0]!, 'processing');

    expect(ordersService.fetchAllOrders).toHaveBeenCalledWith({ status: 'processing' });
  });

  it('changes order status', async () => {
    vi.spyOn(ordersService, 'fetchAllOrders').mockResolvedValue([mockOrder]);
    vi.spyOn(ordersService, 'updateOrderStatus').mockResolvedValue({
      ...mockOrder,
      status: 'processing',
    });

    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <AdminOrdersPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/order-1/i)).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[1]!, 'processing');

    expect(ordersService.updateOrderStatus).toHaveBeenCalledWith('order-1', 'processing', 'admin');
  });
});