import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProductList } from '@/components/catalog/ProductList';
import type { Product } from '@/types/domain';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone',
    price: { amount: 99999, currency: 'USD' },
    category: 'action-figures',
    image: { url: 'https://example.com/iphone.jpg', alt: 'iPhone', key: 'key1' },
    stock: 10,
    rating: 4.8,
    reviewCount: 128,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24',
    description: 'Android flagship',
    price: { amount: 89999, currency: 'USD' },
    category: 'action-figures',
    image: { url: 'https://example.com/samsung.jpg', alt: 'Samsung', key: 'key2' },
    stock: 0,
    rating: 4.5,
    reviewCount: 96,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
  },
];

describe('ProductList', () => {
  it('renders loading state', () => {
    render(<ProductList products={[]} isLoading={true} error={null} />);
    expect(screen.getByText('Cargando productos...')).toBeInTheDocument();
  });

  it('renders products when loaded', () => {
    render(<ProductList products={mockProducts} isLoading={false} error={null} />);
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    expect(screen.getByText('Samsung Galaxy S24')).toBeInTheDocument();
  });

  it('renders empty state when no products', () => {
    render(<ProductList products={[]} isLoading={false} error={null} />);
    expect(screen.getByText(/No se encontraron productos/i)).toBeInTheDocument();
  });

  it('renders error state when error provided', () => {
    render(
      <ProductList products={[]} isLoading={false} error={<span>Something went wrong</span>} />,
    );
    expect(screen.getByText('Error al cargar productos')).toBeInTheDocument();
  });
});
