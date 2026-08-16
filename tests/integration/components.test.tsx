import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import HomePage from '@/pages/HomePage';
import { CartProvider } from '@/store/cart/CartProvider';
import { AuthContext } from '@/contexts/AuthContext';
import type { AuthContextValue } from '@/contexts/AuthContext';

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

describe('Components', () => {
  it('LoadingSpinner renders', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('HomePage renders with navigation links', () => {
    render(
      <AuthContext.Provider value={mockAuthValue}>
        <CartProvider>
          <BrowserRouter>
            <HomePage />
          </BrowserRouter>
        </CartProvider>
      </AuthContext.Provider>,
    );

    expect(screen.getByText(/Ver catálogo/i)).toBeInTheDocument();
    expect(screen.getByText(/Ver carrito/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Iniciar sesión/i })).toBeInTheDocument();
  });
});
