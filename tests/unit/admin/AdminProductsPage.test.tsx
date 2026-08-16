import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminProductsPage } from '@/pages/admin/ProductsPage';

vi.mock('@/services/productsService', () => ({
  productsService: {
    fetchProductsAdmin: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

import { productsService } from '@/services/productsService';

const mockProducts = [
  {
    id: 'prod-1',
    name: 'Test Product 1',
    description: 'Desc 1',
    price: { amount: 10000, currency: 'USD' as const },
    category: 'electronics' as const,
    image: { url: 'img1.jpg', alt: 'Test 1', key: 'key1' },
    stock: 10,
    rating: 4,
    reviewCount: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
  },
  {
    id: 'prod-2',
    name: 'Test Product 2',
    description: 'Desc 2',
    price: { amount: 25000, currency: 'USD' as const },
    category: 'clothing' as const,
    image: { url: 'img2.jpg', alt: 'Test 2', key: 'key2' },
    stock: 5,
    rating: 3,
    reviewCount: 2,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
  },
];

describe('AdminProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders products in table', async () => {
    vi.spyOn(productsService, 'fetchProductsAdmin').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, limit: 20, total: 2, hasNext: false, hasPrev: false },
    });

    render(
      <MemoryRouter initialEntries={['/admin/products']}>
        <AdminProductsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Editar')).toHaveLength(2);
    expect(screen.getAllByText('Eliminar')).toHaveLength(2);
  });

  it('shows delete confirmation modal when delete clicked', async () => {
    vi.spyOn(productsService, 'fetchProductsAdmin').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, limit: 20, total: 2, hasNext: false, hasPrev: false },
    });
    vi.spyOn(productsService, 'deleteProduct').mockResolvedValue(true);

    render(
      <MemoryRouter initialEntries={['/admin/products']}>
        <AdminProductsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Eliminar');
    await userEvent.click(deleteButtons[0]!);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });
  });

  it('filters products by search term', async () => {
    vi.spyOn(productsService, 'fetchProductsAdmin').mockResolvedValue({
      items: mockProducts,
      pagination: { page: 1, limit: 20, total: 2, hasNext: false, hasPrev: false },
    });

    render(
      <MemoryRouter initialEntries={['/admin/products']}>
        <AdminProductsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Buscar productos......');
    await userEvent.type(input, 'Product 1');

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
  });
});
