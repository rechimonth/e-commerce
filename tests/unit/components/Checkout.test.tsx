import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { CartProvider } from '@/store/cart/CartProvider';
import { AuthContext } from '@/contexts/AuthContext';
import type { AuthContextValue } from '@/contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';

const mockUseCart = { items: [{ productId: 'prod-1', name: 'Test Product', price: { amount: 1999, currency: 'USD' }, quantity: 1, image: { url: 'https://example.com/img.png', alt: 'Test', key: 'img-1' }, maxStock: 10 }], totalPrice: { amount: 1999, currency: 'USD' }, totalItems: 1, clearCart: vi.fn() };
const mockUseAuth: AuthContextValue = { user: { uid: 'user-1', email: 'user@test.com', displayName: 'Test User', photoURL: null, role: 'customer', createdAt: new Date(), lastLoginAt: new Date(), preferences: { currency: 'USD', locale: 'es-MX', notifications: true } }, roleState: 'customer', session: { uid: 'user-1', role: 'customer', isAuthenticated: true }, isLoading: false, error: null, signIn: async () => {}, signUp: async () => {}, signInWithGoogle: async () => {}, signOut: async () => {}, refreshUserProfile: async () => {}, clearError: () => {} };
const mockUseCheckout = { status: 'idle' as const, error: null, order: null, isLoading: false, isProcessing: false, processCheckout: vi.fn() };

vi.mock('@/hooks/useCart', () => ({ useCart: () => mockUseCart }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth }));
vi.mock('@/hooks/useCheckout', () => ({ useCheckout: () => mockUseCheckout }));

describe('CheckoutPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('renders checkout form', () => {
    render(<MemoryRouter><AuthContext.Provider value={mockUseAuth}><CartProvider><CheckoutPage /></CartProvider></AuthContext.Provider></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /completa tu pedido/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /tu pedido/i, level: 2 })).toBeInTheDocument();
  });
  it('renders payment method selector', () => {
    render(<MemoryRouter><AuthContext.Provider value={mockUseAuth}><CartProvider><CheckoutPage /></CartProvider></AuthContext.Provider></MemoryRouter>);
    expect(screen.getByText(/Método de pago/i)).toBeInTheDocument();
  });
});