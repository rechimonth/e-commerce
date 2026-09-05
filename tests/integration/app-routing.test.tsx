import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from '@/app/App';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, roleState: 'unauthenticated', session: null, isLoading: false, error: null, signIn: vi.fn(), signUp: vi.fn(), signInWithGoogle: vi.fn(), signOut: vi.fn(), refreshUserProfile: vi.fn(), clearError: vi.fn() }),
}));
vi.mock('@/hooks/useCart', () => ({ useCart: () => ({ items: [], totalItems: 0, totalPrice: { amount: 0, currency: 'USD' }, addItem: vi.fn(), removeItem: vi.fn(), updateQuantity: vi.fn(), clearCart: vi.fn() }) }));

describe('App Routing', () => {
  it('should render HomePage on /', () => {
    render(<MemoryRouter initialEntries={['/']}><Routes><Route path="*" element={<App />} /></Routes></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /Tu próxima colección está aquí/i })).toBeInTheDocument();
  });
});
