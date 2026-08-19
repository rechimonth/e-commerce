import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { CatalogPage } from '@/pages/CatalogPage';

vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(),
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

const mockProducts = [
  {
    id: 'p1',
    name: 'Producto 1',
    description: 'Desc 1',
    price: { amount: 1000, currency: 'USD' },
    category: 'electronics',
    image: { url: 'https://img1', alt: 'img1', key: 'k1' },
    stock: 10,
    rating: 4,
    reviewCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
  },
  {
    id: 'p2',
    name: 'Producto 2',
    description: 'Desc 2',
    price: { amount: 2000, currency: 'USD' },
    category: 'clothing',
    image: { url: 'https://img2', alt: 'img2', key: 'k2' },
    stock: 5,
    rating: 5,
    reviewCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
  },
];

const mockAuth = {
  user: { uid: 'user-1', email: 'test@test.com', displayName: 'Test', photoURL: null, role: 'customer', createdAt: new Date(), lastLoginAt: new Date(), preferences: { currency: 'USD', locale: 'es-MX', notifications: true } },
  roleState: 'customer' as const,
  session: { uid: 'user-1', role: 'customer', isAuthenticated: true },
  isLoading: false,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshUserProfile: async () => {},
  clearError: () => {},
};

describe('CatalogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProducts).mockReturnValue({
      products: mockProducts,
      status: 'success',
      error: null,
      isLoading: false,
      isEmpty: false,
      refetch: vi.fn(),
    });
    vi.mocked(useCart).mockReturnValue({
      items: [],
      totalItems: 0,
      totalPrice: { amount: 0, currency: 'USD' },
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
    });
    vi.mocked(useAuth).mockReturnValue(mockAuth);
  });

  it('renderiza el listado de productos', () => {
    const router = createMemoryRouter(
      [{ path: '/catalog', element: <CatalogPage /> }],
      { initialEntries: ['/catalog'] },
    );

    render(<RouterProvider router={router} />);
    expect(screen.getByText('Producto 1')).toBeInTheDocument();
    expect(screen.getByText('Producto 2')).toBeInTheDocument();
  });

  it('renderiza el buscador', () => {
    const router = createMemoryRouter(
      [{ path: '/catalog', element: <CatalogPage /> }],
      { initialEntries: ['/catalog'] },
    );

    render(<RouterProvider router={router} />);
    expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument();
  });

  it('renderiza los filtros de categoria', () => {
    const router = createMemoryRouter(
      [{ path: '/catalog', element: <CatalogPage /> }],
      { initialEntries: ['/catalog'] },
    );

    render(<RouterProvider router={router} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(6);
  });

  it('renderiza el breadcrumb de Catalogo', () => {
    const router = createMemoryRouter(
      [{ path: '/catalog', element: <CatalogPage /> }],
      { initialEntries: ['/catalog'] },
    );

    render(<RouterProvider router={router} />);
    expect(screen.getAllByText('Catálogo').length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza empty state cuando no hay productos', () => {
    vi.mocked(useProducts).mockReturnValue({
      products: [],
      status: 'success',
      error: null,
      isLoading: false,
      isEmpty: true,
      refetch: vi.fn(),
    });

    const router = createMemoryRouter(
      [{ path: '/catalog', element: <CatalogPage /> }],
      { initialEntries: ['/catalog'] },
    );

    render(<RouterProvider router={router} />);
    expect(screen.getByText(/No se encontraron productos/i)).toBeInTheDocument();
  });
});
