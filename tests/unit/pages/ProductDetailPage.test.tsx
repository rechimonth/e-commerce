import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
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
    fetchProduct: vi.fn(),
    toProduct: vi.fn(),
  },
}));

const mockProduct: Product = {
  id: '1',
  name: 'iPhone 15 Pro',
  description: 'Latest iPhone with A17 chip',
  price: { amount: 99999, currency: 'USD' },
  category: 'action-figures',
  image: { url: 'https://example.com/iphone.jpg', alt: 'iPhone 15 Pro', key: 'key1' },
  stock: 10,
  rating: 4.8,
  reviewCount: 128,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin',
};

function renderProductDetail(productId = '1') {
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <CartProvider>
        <MemoryRouter initialEntries={[`/products/${productId}`]}>
          <Routes>
            <Route path="/products/:id" element={<ProductDetailPage />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthContext.Provider>,
  );
}

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading state initially', () => {
    vi.useFakeTimers();
    (productsService.fetchProduct as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {}),
    );

    renderProductDetail();

    expect(screen.getByText('Detalle')).toBeInTheDocument();
  });

  it('renders product details when loaded', async () => {
    (productsService.fetchProduct as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);

    renderProductDetail();

    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    });

    expect(screen.getByText('Latest iPhone with A17 chip')).toBeInTheDocument();
    expect(screen.getByText('action-figures')).toBeInTheDocument();
    expect(screen.getByText('Agregar al carrito')).toBeInTheDocument();
  });

  it('shows error when product not found', async () => {
    (productsService.fetchProduct as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    renderProductDetail('999');

    await waitFor(() => {
      expect(screen.getByText(/Producto 999 no encontrado/i)).toBeInTheDocument();
    });
  });

  it('shows out of stock when product stock is 0', async () => {
    (productsService.fetchProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockProduct,
      stock: 0,
    });

    renderProductDetail();

    await waitFor(() => {
      expect(screen.getByText('Sin stock')).toBeInTheDocument();
    });
  });
});
