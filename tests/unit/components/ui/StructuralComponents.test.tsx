import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card, Modal, Price, CursorControls, ProductCard } from '@/components/ui';

describe('Card', () => {
  it('renders with header, body, and footer', () => {
    render(
      <Card header={<h3>Header</h3>} footer={<p>Footer</p>}>
        Body content
      </Card>,
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('renders without header/footer when not provided', () => {
    render(<Card>Just body</Card>);
    expect(screen.getByText('Just body')).toBeInTheDocument();
    expect(screen.queryByText('Header')).not.toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        Content
      </Modal>,
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        Content
      </Modal>,
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls onClose when pressing Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <div data-testid="content">Content</div>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking overlay', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <div data-testid="content">Content</div>
      </Modal>,
    );
    const overlay = screen.getByRole('dialog').firstElementChild as HTMLElement;
    fireEvent.mouseDown(overlay);
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Price', () => {
  it('formats cents as dollar amount', () => {
    render(<Price amount={2999} currency="USD" locale="en-US" />);
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('formats cents with EUR', () => {
    render(<Price amount={12999} currency="EUR" locale="de-DE" />);
    expect(screen.getByText('129,99 €')).toBeInTheDocument();
  });

  it('formats Money object', () => {
    render(<Price amount={{ amount: 1999, currency: 'USD' }} locale="en-US" />);
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });
});

describe('CursorControls', () => {
  it('renders Next and Previous buttons', () => {
    render(
      <CursorControls
        hasMore={true}
        isLoading={false}
        onNext={() => {}}
        onPrevious={() => {}}
        canGoPrevious={true}
      />,
    );
    expect(screen.getByText('Anterior')).toBeInTheDocument();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
  });

  it('disables Previous when canGoPrevious is false', () => {
    render(
      <CursorControls
        hasMore={true}
        isLoading={false}
        onNext={() => {}}
        onPrevious={() => {}}
        canGoPrevious={false}
      />,
    );
    expect(screen.getByText('Anterior')).toBeDisabled();
  });

  it('disables Next when hasMore is false', () => {
    render(
      <CursorControls
        hasMore={false}
        isLoading={false}
        onNext={() => {}}
        onPrevious={() => {}}
        canGoPrevious={true}
      />,
    );
    expect(screen.getByText('Siguiente')).toBeDisabled();
  });
});

describe('ProductCard', () => {
  const defaultProps = {
    id: 'prod-1',
    name: 'Test Product',
    priceCents: 2999,
    currency: 'USD' as const,
    imageUrl: 'https://via.placeholder.com/150',
    stock: 10,
  };

  it('renders product name and price', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it.each(['default', 'compact', 'featured'] as const)('renders with variant=%s', (variant) => {
    render(<ProductCard {...defaultProps} variant={variant} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('renders "Agotado" badge when stock is 0', () => {
    render(<ProductCard {...defaultProps} stock={0} />);
    expect(screen.getByText('Agotado')).toBeInTheDocument();
  });

  it('calls onAddToCart when Add button clicked', () => {
    const onAddToCart = vi.fn();
    render(<ProductCard {...defaultProps} onAddToCart={onAddToCart} />);
    fireEvent.click(screen.getByText('Agregar'));
    expect(onAddToCart).toHaveBeenCalledWith('prod-1');
  });
});
