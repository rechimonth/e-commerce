import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboardPage } from '@/pages/admin/DashboardPage';
import { AdminProductsPage } from '@/pages/admin/ProductsPage';
import { AdminProductFormPage } from '@/pages/admin/ProductFormPage';
import { AdminOrdersPage } from '@/pages/admin/OrdersPage';
import { AdminOrderDetailPage } from '@/pages/admin/OrderDetailPage';
import { ROUTES } from '@/constants/routes';

vi.mock('@/services/productsService', () => ({
  productsService: {
    fetchProductsAdmin: vi.fn(),
    fetchProduct: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));
vi.mock('@/services/ordersService', () => ({
  ordersService: {
    fetchAllOrders: vi.fn(),
    fetchOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
    fetchUserOrders: vi.fn(),
    cancelOrder: vi.fn(),
  },
}));

import { productsService } from '@/services/productsService';
import { ordersService } from '@/services/ordersService';

function createAdminAuth() {
  return {
    user: {
      uid: 'admin-1',
      email: 'admin@test.com',
      displayName: 'Admin User',
      photoURL: null,
      role: 'admin' as const,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: { currency: 'USD' as const, locale: 'es-MX', notifications: true },
    },
    roleState: 'admin' as const,
    session: { uid: 'admin-1', role: 'admin' as const, isAuthenticated: true as const },
    isLoading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshUserProfile: vi.fn(),
    clearError: vi.fn(),
  };
}

function renderAdminRoute(route: string) {
  return render(
    <AuthContext.Provider value={createAdminAuth()}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={ROUTES.ADMIN} element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<AdminProductFormPage />} />
            <Route path="products/:id/edit" element={<AdminProductFormPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('Admin Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productsService.fetchProductsAdmin).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, hasNext: false, hasPrev: false },
    });
    vi.mocked(ordersService.fetchOrder).mockResolvedValue(null);
    vi.mocked(ordersService.fetchAllOrders).mockResolvedValue([]);
  });

  it('renders dashboard on /admin', async () => {
    renderAdminRoute('/admin');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    });
  });

  it('renders products page on /admin/products', async () => {
    renderAdminRoute('/admin/products');
    await waitFor(() => {
      expect(screen.getByTestId('nav-link-productos')).toHaveTextContent('Productos');
    });
  });

  it('renders new product form on /admin/products/new', async () => {
    renderAdminRoute('/admin/products/new');
    await waitFor(() => {
      expect(screen.getByText('Nuevo producto')).toBeInTheDocument();
    });
  });

  it('renders orders page on /admin/orders', async () => {
    renderAdminRoute('/admin/orders');
    await waitFor(() => {
      expect(screen.getByText('Órdenes')).toBeInTheDocument();
    });
  });

  it('renders order detail on /admin/orders/:id', async () => {
    renderAdminRoute('/admin/orders/order-1');
    await waitFor(() => {
      expect(screen.getByText('Orden no encontrada')).toBeInTheDocument();
    });
  });
});
