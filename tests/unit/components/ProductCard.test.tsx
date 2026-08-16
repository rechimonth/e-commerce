import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/components/ui/ProductCard';

const mockProduct = {
  id: 'p1',
  name: 'Producto Test',
  priceCents: 1999,
  currency: 'USD',
  imageUrl: 'https://img',
  imageAlt: 'Producto Test',
  category: 'electronics',
  stock: 10,
  rating: 4.5,
  reviewCount: 100,
};

describe('ProductCard', () => {
  it('renderiza nombre y precio', () => {
    render(<ProductCard {...mockProduct} />);
    expect(screen.getByText('Producto Test')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });

  it('renderiza categoria', () => {
    render(<ProductCard {...mockProduct} />);
    expect(screen.getByText('electronics')).toBeInTheDocument();
  });

  it('renderiza rating y reviewCount', () => {
    render(<ProductCard {...mockProduct} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(100 reseñas)')).toBeInTheDocument();
  });

  it('renderiza boton Agregar cuando onAddToCart esta presente', () => {
    const onAdd = vi.fn();
    render(<ProductCard {...mockProduct} onAddToCart={onAdd} />);
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument();
  });

  it('renderiza boton Vista rapida cuando onQuickView esta presente', () => {
    render(<ProductCard {...mockProduct} onQuickView={() => {}} />);
    expect(screen.getByRole('button', { name: 'Vista rápida' })).toBeInTheDocument();
  });

  it('llama a onAddToCart cuando se hace clic en Agregar', () => {
    const onAdd = vi.fn();
    render(<ProductCard {...mockProduct} onAddToCart={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(onAdd).toHaveBeenCalledWith('p1');
  });

  it('llama a onQuickView cuando se hace clic en Vista rapida', () => {
    const onQuickView = vi.fn();
    render(<ProductCard {...mockProduct} onQuickView={onQuickView} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vista rápida' }));
    expect(onQuickView).toHaveBeenCalledWith('p1');
  });

  it('deshabilita boton cuando stock es 0', () => {
    render(<ProductCard {...mockProduct} stock={0} onAddToCart={() => {}} />);
    expect(screen.getByRole('button', { name: 'Agotado' })).toBeDisabled();
  });

  it('renderiza badge Agotado cuando stock es 0', () => {
    render(<ProductCard {...mockProduct} stock={0} onAddToCart={() => {}} />);
    const badges = screen.getAllByText('Agotado');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });
});