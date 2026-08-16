import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProductFilters } from '@/components/catalog/ProductFilters';
import type { ProductCategory } from '@/types/domain';

const categories = [
  { id: 'electronics' as ProductCategory, label: 'Electrónicos', count: 12 },
  { id: 'clothing' as ProductCategory, label: 'Ropa', count: 5 },
  { id: 'books' as ProductCategory, label: 'Libros' },
];

describe('ProductFilters', () => {
  it('renders all categories with "Todos" option', () => {
    render(
      <ProductFilters categories={categories} selected="all" onSelect={() => {}} />,
    );
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Electrónicos')).toBeInTheDocument();
    expect(screen.getByText('Ropa')).toBeInTheDocument();
    expect(screen.getByText('Libros')).toBeInTheDocument();
  });

  it('calls onSelect when category clicked', () => {
    const onSelect = vi.fn();
    render(<ProductFilters categories={categories} selected="all" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Electrónicos'));
    expect(onSelect).toHaveBeenCalledWith('electronics');
  });

  it('highlights selected category', () => {
    render(
      <ProductFilters categories={categories} selected="electronics" onSelect={() => {}} />,
    );
    const btn = screen.getByText('Electrónicos');
    expect(btn).toHaveClass('border-primary-600');
  });

  it('shows counts when showCounts is true', () => {
    render(
      <ProductFilters
        categories={categories}
        selected="all"
        onSelect={() => {}}
        showCounts
      />,
    );
    expect(screen.getByText('(12)')).toBeInTheDocument();
    expect(screen.getByText('(5)')).toBeInTheDocument();
  });

  it('renders with default categories when none provided', () => {
    render(
      <ProductFilters categories={[]} selected="all" onSelect={() => {}} />,
    );
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });
});
