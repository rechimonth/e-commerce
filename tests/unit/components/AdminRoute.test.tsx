import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';
import { AdminRoute } from '@/components/auth/AdminRoute';

describe('AdminRoute', () => {
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
      [{ path: '/', element: <AdminRoute><div>Contenido admin</div></AdminRoute> }],
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
        { path: '/admin', element: <AdminRoute><div>Contenido admin</div></AdminRoute> },
      ],
      { initialEntries: ['/admin'] },
    );

    render(<RouterProvider router={router} />);
    expect(screen.queryByText('Contenido admin')).not.toBeInTheDocument();
  });

  it('redirige a /403 cuando roleState es customer', () => {
    vi.mocked(useAuth).mockReturnValue({
      roleState: 'customer',
      isLoading: false,
      user: { uid: '1', email: 'a@b.com', displayName: 'A', photoURL: null, role: 'customer', createdAt: new Date(), lastLoginAt: new Date(), preferences: { currency: 'USD', locale: 'es-MX', notifications: true } },
      session: { uid: '1', role: 'customer', isAuthenticated: true },
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
        { path: '/403', element: <div>403 page</div> },
        { path: '/admin', element: <AdminRoute><div>Contenido admin</div></AdminRoute> },
      ],
      { initialEntries: ['/admin'] },
    );

    render(<RouterProvider router={router} />);
    expect(screen.queryByText('Contenido admin')).not.toBeInTheDocument();
  });

  it('renderiza children cuando roleState es admin', () => {
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
      [{ path: '/', element: <AdminRoute><div>Contenido admin</div></AdminRoute> }],
      { initialEntries: ['/'] },
    );

    render(<RouterProvider router={router} />);
    expect(screen.getByText('Contenido admin')).toBeInTheDocument();
  });
});
