import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartPage } from '@/pages/CartPage';
import { CartProvider } from '@/store/cart/CartProvider';
import { MemoryRouter } from 'react-router-dom';

const mockRemoveItem = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockClearCart = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'user-1',
      email: 'user@test.com',
      displayName: 'Test User',
      photoURL: null,
      role: 'customer',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: { currency: 'USD', locale: 'es-MX', notifications: true },
    },
    roleState: 'customer',
    session: { uid: 'user-1', role: 'customer', isAuthenticated: true },
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

vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    items: [
      {
        productId: 'prod-1',
        name: 'Test Product',
        price: { amount: 1999, currency: 'USD' },
        quantity: 2,
        image: { url: 'https://example.com/img.png', alt: 'Test', key: 'img-1' },
        maxStock: 10,
      },
    ],
    totalItems: 2,
    totalPrice: { amount: 3998, currency: 'USD' },
    addItem: vi.fn(),
    removeItem: mockRemoveItem,
    updateQuantity: mockUpdateQuantity,
    clearCart: mockClearCart,
  }),
}));

describe('CartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cart items', () => {
    render(
      <MemoryRouter>
        <CartProvider>
            <CartPage />
          </CartProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('renders total price', () => {
    render(
      <MemoryRouter>
        <CartProvider>
            <CartPage />
          </CartProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText('$39.98')).toBeInTheDocument();
  });
});

