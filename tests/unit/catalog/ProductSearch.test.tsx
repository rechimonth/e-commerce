import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProductSearch } from '@/components/catalog/ProductSearch';

describe('ProductSearch', () => {
  it('renders with placeholder', () => {
    render(<ProductSearch value="" onChange={() => {}} placeholder="Buscar..." />);
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('renders with default placeholder', () => {
    render(<ProductSearch value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument();
  });

  it('calls onChange with input value', () => {
    const onChange = vi.fn();
    render(<ProductSearch value="" onChange={onChange} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('is a controlled component', () => {
    render(<ProductSearch value="initial" onChange={() => {}} />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('initial');
  });

  it('renders search icon', () => {
    render(<ProductSearch value="" onChange={() => {}} />);
    const svg = screen.getByRole('searchbox').parentElement?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
