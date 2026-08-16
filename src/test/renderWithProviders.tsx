import { type ReactNode, type ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthProvider';
import { CartProvider } from '@/store/cart/CartProvider';
import { AuthContext } from '@/contexts/AuthContext';
import type { AuthContextValue } from '@/contexts/AuthContext';

export interface RenderWithProvidersOptions {
  readonly initialEntries?: string[];
  readonly authValue?: Partial<AuthContextValue>;
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) {
  const { initialEntries = ['/'], authValue } = options;

  const defaultAuthValue: AuthContextValue = {
    user: null,
    roleState: 'unauthenticated',
    session: null,
    isLoading: false,
    error: null,
    signIn: async () => {},
    signUp: async () => {},
    signInWithGoogle: async () => {},
    signOut: async () => {},
    refreshUserProfile: async () => {},
    clearError: () => {},
    ...authValue,
  };

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={defaultAuthValue}>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );

  return {
    wrapper: Wrapper,
  };
}
