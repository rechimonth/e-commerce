import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import { ROUTES } from '@/constants/routes';

describe('UnauthorizedPage', () => {
  it('renders 403 heading', () => {
    render(<UnauthorizedPage />, { wrapper: BrowserRouter });
    expect(screen.getByText('403')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<UnauthorizedPage />, { wrapper: BrowserRouter });
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
    expect(screen.getByText(/permisos para acceder/i)).toBeInTheDocument();
  });

  it('renders link back to home', () => {
    render(<UnauthorizedPage />, { wrapper: BrowserRouter });
    const link = screen.getByRole('link', { name: 'Volver al inicio' });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe(ROUTES.HOME);
  });
});
