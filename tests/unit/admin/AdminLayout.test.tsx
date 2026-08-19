import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';

function createAuthValue(overrides = {}) {
  return {
    user: {
      uid: 'admin-1',
      email: 'admin@test.com',
      displayName: 'Admin User',
      photoURL: null,
      role: 'admin' as const,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: { currency: 'USD' as const, locale: 'es-MX', notifications: true },
    },
    roleState: 'admin' as const,
    session: { uid: 'admin-1', role: 'admin' as const, isAuthenticated: true as const },
    isLoading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshUserProfile: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  };
}

describe('AdminLayout', () => {
  it('renders sidebar with navigation items', () => {
    render(
      <AuthContext.Provider value={createAuthValue()}>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminLayout />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByTestId('nav-link-dashboard')).toHaveTextContent('Dashboard');
    expect(screen.getByTestId('nav-link-productos')).toHaveTextContent('Productos');
    expect(screen.getByTestId('nav-link-órdenes')).toHaveTextContent('Órdenes');
    expect(screen.getByTestId('nav-link-usuarios')).toHaveTextContent('Usuarios');
    expect(screen.getByTestId('nav-link-categorías')).toHaveTextContent('Categorías');
    expect(screen.getByTestId('nav-link-media')).toHaveTextContent('Media');
    expect(screen.getByTestId('nav-link-analytics')).toHaveTextContent('Analytics');
    expect(screen.getByTestId('nav-link-auditoría')).toHaveTextContent('Auditoría');
    expect(screen.getByTestId('nav-link-configuración')).toHaveTextContent('Configuración');
  });

  it('renders user display name in sidebar', () => {
    render(
      <AuthContext.Provider value={createAuthValue()}>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminLayout />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByTestId('user-display-name')).toHaveTextContent('Admin User');
  });

  it('renders logout button', () => {
    render(
      <AuthContext.Provider value={createAuthValue()}>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminLayout />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByTestId('logout-button')).toHaveTextContent('Cerrar sesión');
  });

  it('calls signOut when logout button clicked', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    render(
      <AuthContext.Provider value={createAuthValue({ signOut })}>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminLayout />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const logoutBtn = screen.getByTestId('logout-button');
    fireEvent.click(logoutBtn);

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
