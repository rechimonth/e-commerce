import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrdersPage from '@/pages/OrdersPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { CartProvider } from '@/store/cart/CartProvider';
import { AuthContext } from '@/contexts/AuthContext';
import type { AuthContextValue } from '@/contexts/AuthContext';

vi.mock('@/services/ordersService', () => ({ ordersService: { fetchUserOrders: vi.fn().mockResolvedValue([]), fetchOrder: vi.fn().mockResolvedValue(null), cancelOrder: vi.fn() } }));
vi.mock('@/hooks/useCheckout', () => ({ useCheckout: () => ({ status: 'idle', error: null, order: null, isLoading: false, isProcessing: false, processCheckout: vi.fn().mockResolvedValue(undefined) }) }));

const mockAuthValue: AuthContextValue = { user: null, roleState: 'unauthenticated', session: null, isLoading: false, error: null, signIn: () => Promise.resolve(), signUp: () => Promise.resolve(), signInWithGoogle: () => Promise.resolve(), signOut: () => Promise.resolve(), refreshUserProfile: () => Promise.resolve(), clearError: () => {} };

function renderWithProviders(ui: React.ReactNode, initialEntries: string[] = ['/']) {
  return render(<AuthContext.Provider value={mockAuthValue}><CartProvider><MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter></CartProvider></AuthContext.Provider>);
}

describe('App Routing', () => {
  it('should render HomePage on /', () => {
    renderWithProviders(<Routes><Route path='/' element={<HomePage />} /><Route path='/cart' element={<CartPage />} /><Route path='/checkout' element={<CheckoutPage />} /><Route path='/orders' element={<OrdersPage />} /><Route path='*' element={<NotFoundPage />} /></Routes>, ['/']);
    expect(screen.getByRole('heading', { name: /Tu próxima colección está aquí/i })).toBeInTheDocument();
  });

  it('should render NotFoundPage on unknown route', () => {
    renderWithProviders(<Routes><Route path='/' element={<HomePage />} /><Route path='/cart' element={<CartPage />} /><Route path='/checkout' element={<CheckoutPage />} /><Route path='/orders' element={<OrdersPage />} /><Route path='*' element={<NotFoundPage />} /></Routes>, ['/nonexistent']);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
  });

  it('should render CartPage on /cart', () => {
    renderWithProviders(<Routes><Route path='/cart' element={<CartPage />} /><Route path='*' element={<NotFoundPage />} /></Routes>, ['/cart']);
    expect(screen.getByText(/Tu carrito está vacío/i)).toBeInTheDocument();
  });

  it('should render CheckoutPage on /checkout', () => {
    renderWithProviders(<Routes><Route path='/checkout' element={<CheckoutPage />} /><Route path='*' element={<NotFoundPage />} /></Routes>, ['/checkout']);
    expect(screen.getByText(/Tu carrito está vacío/i)).toBeInTheDocument();
  });

  it('should render OrdersPage on /orders', () => {
    renderWithProviders(<Routes><Route path='/orders' element={<OrdersPage />} /><Route path='*' element={<NotFoundPage />} /></Routes>, ['/orders']);
    expect(screen.getByRole('heading', { name: /Mis Órdenes/i })).toBeInTheDocument();
  });
});
