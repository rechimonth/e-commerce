import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { CartPage } from '@/pages/CartPage';
import { AuthContext } from '@/contexts/AuthContext';
import { CartContext } from '@/store/cart/CartContext';
import type { AuthContextValue } from '@/contexts/AuthContext';
import type { CartContextValue } from '@/store/cart/CartContext';
import type { CartItem } from '@/types/cart';
import { money } from '@/types/pricing';

const mockAuthValue: AuthContextValue = {
  user: null, roleState: 'unauthenticated', session: null, isLoading: false, error: null,
  signIn: () => Promise.resolve(), signUp: () => Promise.resolve(), signInWithGoogle: () => Promise.resolve(), signOut: () => Promise.resolve(), refreshUserProfile: () => Promise.resolve(), clearError: () => {},
};

const mockCartItem: CartItem = { productId: 'p1', name: 'Test Product', price: money(10.0), quantity: 2, image: { url: 'https://example.com/img.png', alt: 'Test', key: 'img-1' }, maxStock: 10 };

function createMockCart(items: CartItem[]): CartContextValue {
  return { items, totalItems: items.reduce((sum, i) => sum + i.quantity, 0), totalPrice: { amount: items.reduce((sum, i) => sum + i.price.amount * i.quantity, 0), currency: 'USD' }, addItem: vi.fn(), removeItem: vi.fn(), updateQuantity: vi.fn(), clearCart: vi.fn() };
}

function renderCartPage(cartValue: CartContextValue) {
  return render(<AuthContext.Provider value={mockAuthValue}><CartContext.Provider value={cartValue}><MemoryRouter initialEntries={['/cart']}><CartPage /></MemoryRouter></CartContext.Provider></AuthContext.Provider>);
}

describe('CartPage', () => {
  it('renders empty state when cart is empty', () => {
    renderCartPage(createMockCart([]));
    expect(screen.getByText(/Tu carrito está vacío/i)).toBeInTheDocument();
    expect(screen.getByText(/Ver productos/i)).toBeInTheDocument();
  });

  it('renders cart items when cart has products', () => {
    renderCartPage(createMockCart([mockCartItem]));
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Continuar al checkout')).toBeInTheDocument();
    expect(screen.getByText('Seguir comprando')).toBeInTheDocument();
  });

  it('shows correct totals', () => {
    renderCartPage(createMockCart([mockCartItem]));
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('Elementos')).toBeInTheDocument();
  });

  it('shows clear-cart confirmation before clearing', () => {
    const mockCart = createMockCart([mockCartItem]);
    renderCartPage(mockCart);
    fireEvent.click(screen.getByText('Vaciar carrito'));
    expect(screen.getByText(/¿Seguro que quieres borrar todo/i)).toBeInTheDocument();
    expect(mockCart.clearCart).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Sí, vaciar'));
    expect(mockCart.clearCart).toHaveBeenCalledTimes(1);
  });

  it('has a link to checkout', () => {
    renderCartPage(createMockCart([mockCartItem]));
    const checkoutLink = screen.getByRole('link', { name: /Continuar al checkout/i });
    expect(checkoutLink).toHaveAttribute('href', '/checkout');
  });

  it('has a link to continue shopping', () => {
    renderCartPage(createMockCart([mockCartItem]));
    const catalogLink = screen.getByRole('link', { name: /Seguir comprando/i });
    expect(catalogLink).toHaveAttribute('href', '/catalog');
  });

  it('calls removeItem when remove button is clicked', () => {
    const mockCart = createMockCart([mockCartItem]);
    renderCartPage(mockCart);
    const removeButton = screen.getByLabelText(/Eliminar Test Product/i);
    fireEvent.click(removeButton);
    expect(mockCart.removeItem).toHaveBeenCalledWith('p1');
  });
});
