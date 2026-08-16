import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuantitySelector, SearchInput, CategoryFilter } from '@/components/ui';

describe('QuantitySelector', () => {
  it('renders the current quantity', () => {
    render(<QuantitySelector quantity={5} onChange={() => {}} />);
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('calls onChange with decremented value when clicking -', () => {
    const onChange = vi.fn();
    render(<QuantitySelector quantity={5} onChange={onChange} min={1} max={10} />);
    const decrementButton = screen.getAllByRole('button')[0]!;
    fireEvent.click(decrementButton);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('calls onChange with incremented value when clicking +', () => {
    const onChange = vi.fn();
    render(<QuantitySelector quantity={5} onChange={onChange} min={1} max={10} />);
    const incrementButton = screen.getAllByRole('button')[1]!;
    fireEvent.click(incrementButton);
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('does not decrement below min', () => {
    const onChange = vi.fn();
    render(<QuantitySelector quantity={1} onChange={onChange} min={1} max={10} />);
    const decrementButton = screen.getAllByRole('button')[0]!;
    expect(decrementButton).toBeDisabled();
  });

  it('does not increment above max', () => {
    const onChange = vi.fn();
    render(<QuantitySelector quantity={10} onChange={onChange} min={1} max={10} />);
    const incrementButton = screen.getAllByRole('button')[1]!;
    expect(incrementButton).toBeDisabled();
  });

  it('renders as plain text when readOnly', () => {
    render(<QuantitySelector quantity={5} onChange={() => {}} readOnly />);
    expect(screen.queryAllByRole('button').length).toBe(0);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('SearchInput', () => {
  it('renders with placeholder', () => {
    render(<SearchInput placeholder="Buscar..." />);
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('calls onSearch with debounced value', async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} debounceMs={10} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'test' } });
    await new Promise((r) => setTimeout(r, 20));
    expect(onSearch).toHaveBeenCalledWith('test');
  });

  it('renders search icon', () => {
    render(<SearchInput placeholder="Buscar..." />);
    const svg = screen.getByRole('searchbox').parentElement?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

describe('CategoryFilter', () => {
  const categories = [
    { id: 'electronics' as const, label: 'Electrónicos', count: 12 },
    { id: 'clothing' as const, label: 'Ropa', count: 5 },
  ];

  it('renders all categories plus "all" button', () => {
    render(<CategoryFilter categories={categories} selected="all" onSelect={() => {}} />);
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Electrónicos')).toBeInTheDocument();
    expect(screen.getByText('Ropa')).toBeInTheDocument();
  });

  it('calls onSelect with category when clicked', () => {
    const onSelect = vi.fn();
    render(<CategoryFilter categories={categories} selected="all" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Electrónicos'));
    expect(onSelect).toHaveBeenCalledWith('electronics');
  });

  it('shows counts when showCounts is true', () => {
    render(
      <CategoryFilter categories={categories} selected="all" onSelect={() => {}} showCounts />,
    );
    expect(screen.getByText('(12)')).toBeInTheDocument();
    expect(screen.getByText('(5)')).toBeInTheDocument();
  });
});
