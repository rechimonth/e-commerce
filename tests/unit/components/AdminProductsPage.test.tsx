import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminProductsPage } from '@/pages/admin/ProductsPage';
import { AuthContext } from '@/contexts/AuthContext';
import { CartProvider } from '@/store/cart/CartProvider';
import type { AuthContextValue } from '@/contexts/AuthContext';

const mockAuthValue: AuthContextValue = {
  user: { uid: 'admin-1', email: 'admin@test.com', displayName: 'Admin', photoURL: null, role: 'admin', createdAt: new Date(), lastLoginAt: new Date(), preferences: { currency: 'USD', locale: 'es-MX', notifications: true } },
  roleState: 'admin',
  session: { uid: 'admin-1', role: 'admin', isAuthenticated: true },
  isLoading: false,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshUserProfile: async () => {},
  clearError: () => {},
};

const mockProducts = [
  {
    id: 'p1',
    name: 'Producto 1',
    description: 'Desc',
    price: { amount: 1000, currency: 'USD' },
    category: 'action-figures',
    image: { url: 'https://img1', alt: 'img1', key: 'k1' },
    stock: 10,
    rating: 4,
    reviewCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
  },
];

vi.mock('@/services/productsService', () => ({
  productsService: {
    fetchProductsAdmin: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={mockAuthValue}>
        <CartProvider>{ui}</CartProvider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('AdminProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza la tabla de productos', async () => {
    const { productsService } = await import('@/services/productsService');
    (productsService.fetchProductsAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({ items: mockProducts, pagination: { page: 1, limit: 20, total: 1, hasNext: false, hasPrev: false } });

    renderWithProviders(<AdminProductsPage />);

    await waitFor(() => {
      expect(screen.getByText('Producto 1')).toBeInTheDocument();
    });
  });

  it('renderiza el boton Nuevo producto', async () => {
    const { productsService } = await import('@/services/productsService');
    (productsService.fetchProductsAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({ items: mockProducts, pagination: { page: 1, limit: 20, total: 1, hasNext: false, hasPrev: false } });

    renderWithProviders(<AdminProductsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Nuevo producto' })).toBeInTheDocument();
    });
  });

  it('filtra productos por busqueda', async () => {
    const { productsService } = await import('@/services/productsService');
    (productsService.fetchProductsAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({ items: mockProducts, pagination: { page: 1, limit: 20, total: 1, hasNext: false, hasPrev: false } });

    renderWithProviders(<AdminProductsPage />);

    await waitFor(() => {
      expect(screen.getByText('Producto 1')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Buscar productos...');
    await userEvent.type(input, 'Producto 1');

    expect(input).toHaveValue('Producto 1');
  });

  it('abre modal de confirmacion de eliminacion', async () => {
    const { productsService } = await import('@/services/productsService');
    (productsService.fetchProductsAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({ items: mockProducts, pagination: { page: 1, limit: 20, total: 1, hasNext: false, hasPrev: false } });

    renderWithProviders(<AdminProductsPage />);

    await waitFor(() => {
      expect(screen.getByText('Producto 1')).toBeInTheDocument();
    });

    userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument();
    });
  });
});




