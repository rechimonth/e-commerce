import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type * as ReactRouterDom from 'react-router-dom';
import { MemoryRouter } from 'react-router-dom';
import { AdminProductFormPage } from '@/pages/admin/ProductFormPage';

const mockFetchProduct = vi.fn();
const mockCreateProduct = vi.fn();
const mockUpdateProduct = vi.fn();

vi.mock('@/services/productsService', () => ({
  productsService: {
    fetchProduct: (...args: Parameters<typeof mockFetchProduct>) => mockFetchProduct(...args),
    createProduct: (...args: Parameters<typeof mockCreateProduct>) => mockCreateProduct(...args),
    updateProduct: (...args: Parameters<typeof mockUpdateProduct>) => mockUpdateProduct(...args),
  },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>();
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

import { useParams } from 'react-router-dom';

const mockProduct = {
  id: 'prod-1',
  name: 'Test Product',
  description: 'Test Description',
  price: { amount: 15000, currency: 'USD' as const },
  category: 'electronics' as const,
  image: { url: 'img.jpg', alt: 'Test', key: 'key' },
  stock: 10,
  rating: 4,
  reviewCount: 5,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin',
};

describe('AdminProductFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue({});
  });

  it('renders create form without product id', () => {
    render(
      <MemoryRouter initialEntries={['/admin/products/new']}>
        <AdminProductFormPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Nuevo producto')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Precio (USD)')).toBeInTheDocument();
    expect(screen.getByLabelText('Stock')).toBeInTheDocument();
  });

  it('loads product data in edit mode', async () => {
    vi.mocked(useParams).mockReturnValue({ id: 'prod-1' });
    mockFetchProduct.mockResolvedValue(mockProduct);

    render(
      <MemoryRouter initialEntries={['/admin/products/prod-1/edit']}>
        <AdminProductFormPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Editar producto')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });
  });

  it('calls createProduct on form submit', async () => {
    mockCreateProduct.mockResolvedValue({
      id: 'new-id',
      name: 'Test',
      description: 'Desc',
      price: { amount: 100, currency: 'USD' as const },
      category: 'electronics' as const,
      image: { url: '', alt: 'Test', key: '' },
      stock: 0,
      rating: 0,
      reviewCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
    });

    render(
      <MemoryRouter initialEntries={['/admin/products/new']}>
        <AdminProductFormPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText('Precio (USD)'), { target: { value: '99.99' } });
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('URL de la imagen'), { target: { value: 'img.jpg' } });

    fireEvent.click(screen.getByText('Crear producto'));

    await waitFor(() => {
      expect(mockCreateProduct).toHaveBeenCalledTimes(1);
    });
  });
});

