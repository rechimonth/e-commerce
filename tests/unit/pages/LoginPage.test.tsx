import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@/components/layout/Header', () => ({ Header: () => null }));

describe('LoginPage', () => {
  it('shows a readable Spanish message for invalid credentials and a black Google label', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      roleState: 'unauthenticated',
      error: { code: 'UNAUTHORIZED', message: 'auth/invalid-credential' },
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El correo o la contraseña no son correctos.',
    );
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toHaveClass(
      '!text-black',
    );
  });

  it('explains the database connection failure without exposing its internal message', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      roleState: 'unauthenticated',
      error: { code: 'INTERNAL_ERROR', message: 'Database is closing/hidden' },
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'La conexión con la base de datos se cerró. Recarga la página e inténtalo de nuevo.',
    );
    expect(screen.getByRole('alert')).not.toHaveTextContent('Database is closing/hidden');
  });
});