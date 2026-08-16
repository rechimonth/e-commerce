import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra spinner cuando isLoading es true', () => {
    vi.mocked(useAuth).mockReturnValue({
      roleState: 'loading',
      isLoading: true,
      user: null,
      session: null,
      error: null,
      signIn: async () => {},
      signUp: async () => {},
      signInWithGoogle: async () => {},
      signOut: async () => {},
      refreshUserProfile: async () => {},
      clearError: () => {},
    });

    const router = createMemoryRouter(
      [{ path: '/', element: <ProtectedRoute><div>Contenido protegido</div></ProtectedRoute> }],
      { initialEntries: ['/'] },
    );

    const { container } = render(<RouterProvider router={router} />);
    expect(container.querySelector('.flex.items-center.justify-center')).toBeTruthy();
  });

  it('redirige a login cuando roleState es unauthenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      roleState: 'unauthenticated',
      isLoading: false,
      user: null,
      session: null,
      error: null,
      signIn: async () => {},
      signUp: async () => {},
      signInWithGoogle: async () => {},
      signOut: async () => {},
      refreshUserProfile: async () => {},
      clearError: () => {},
    });

    const router = createMemoryRouter(
      [
        { path: '/login', element: <div>Login page</div> },
        { path: '/protected', element: <ProtectedRoute><div>Contenido protegido</div></ProtectedRoute> },
      ],
      { initialEntries: ['/protected'] },
    );

    render(<RouterProvider router={router} />);
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('renderiza children cuando esta autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      roleState: 'admin',
      isLoading: false,
      user: { uid: '1', email: 'a@b.com', displayName: 'A', photoURL: null, role: 'admin', createdAt: new Date(), lastLoginAt: new Date(), preferences: { currency: 'USD', locale: 'es-MX', notifications: true } },
      session: { uid: '1', role: 'admin', isAuthenticated: true },
      error: null,
      signIn: async () => {},
      signUp: async () => {},
      signInWithGoogle: async () => {},
      signOut: async () => {},
      refreshUserProfile: async () => {},
      clearError: () => {},
    });

    const router = createMemoryRouter(
      [{ path: '/', element: <ProtectedRoute><div>Contenido protegido</div></ProtectedRoute> }],
      { initialEntries: ['/'] },
    );

    render(<RouterProvider router={router} />);
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });
});
