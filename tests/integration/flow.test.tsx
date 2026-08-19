import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthProvider';
import { CartProvider } from '@/store/cart/CartProvider';
import { CatalogPage } from '@/pages/CatalogPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'customer-1',
      email: 'customer@test.com',
      displayName: 'Customer',
      photoURL: null,
      role: 'customer',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: { currency: 'USD', locale: 'es-MX', notifications: true },
    },
    roleState: 'customer',
    session: { uid: 'customer-1', role: 'customer', isAuthenticated: true },
    isLoading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshUserProfile: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('@/services/ordersService', () => ({
  ordersService: {
    fetchUserOrders: vi.fn().mockResolvedValue([]),
    fetchOrder: vi.fn(),
    cancelOrder: vi.fn(),
    fetchAllOrders: vi.fn(),
    updateOrderStatus: vi.fn(),
  },
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    items: [],
    totalItems: 0,
    totalPrice: { amount: 0, currency: 'USD' },
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCheckout', () => ({
  useCheckout: () => ({
    status: 'idle',
    error: null,
    order: null,
    isLoading: false,
    isProcessing: false,
    processCheckout: vi.fn().mockResolvedValue(undefined),
  }),
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

describe('Integration flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders catalog page', () => {
    render(
      <MemoryRouter initialEntries={['/catalog']}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path='/catalog' element={<CatalogPage />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/catálogo/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders cart page', () => {
    render(
      <MemoryRouter initialEntries={['/cart']}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path='/cart' element={<CartPage />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Carrito')).toBeInTheDocument();
  });

  it('renders checkout page', () => {
    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path='/checkout' element={<CheckoutPage />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Checkout')).toBeInTheDocument();
  });
});
