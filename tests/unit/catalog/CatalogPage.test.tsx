import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { CatalogPage } from '@/pages/CatalogPage';
import { productsService } from '@/services/productsService';
import { CartProvider } from '@/store/cart/CartProvider';
import { AuthContext } from '@/contexts/AuthContext';
import type { AuthContextValue } from '@/contexts/AuthContext';
import type { Product } from '@/types/domain';

const mockAuthValue: AuthContextValue = {
  user: null,
  roleState: 'unauthenticated',
  session: null,
  isLoading: false,
  error: null,
  signIn: () => Promise.resolve(),
  signUp: () => Promise.resolve(),
  signInWithGoogle: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
  refreshUserProfile: () => Promise.resolve(),
  clearError: () => {},
};

vi.mock('@/services/productsService', () => ({
  productsService: {
    fetchProducts: vi.fn(),
    toProduct: vi.fn(),
  },
}));

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone',
    price: { amount: 99999, currency: 'USD' },
    category: 'electronics',
    image: { url: 'https://example.com/iphone.jpg', alt: 'iPhone', key: 'key1' },
    stock: 10,
    rating: 4.8,
    reviewCount: 128,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
  },
];

function renderCatalog() {
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <CartProvider>
        <MemoryRouter initialEntries={['/catalog']}>
          <CatalogPage />
        </MemoryRouter>
      </CartProvider>
    </AuthContext.Provider>,
  );
}

describe('CatalogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders catalog with loading state initially', () => {
    vi.useFakeTimers();
    (productsService.fetchProducts as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {}),
    );

    renderCatalog();

    expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument();
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });

  it('renders products after load', async () => {
    (productsService.fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, limit: 20, total: 1, hasNext: false, hasPrev: false },
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    });
  });

  it('shows empty state when no products', async () => {
    (productsService.fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, hasNext: false, hasPrev: false },
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText(/No se encontraron productos/i)).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    (productsService.fetchProducts as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error'),
    );

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });
});
