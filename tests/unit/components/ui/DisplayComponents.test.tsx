import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Badge,
  Alert,
  OrderStatusBadge,
  Skeleton,
  Spinner,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/ui';

describe('Badge', () => {
  it.each(['default', 'success', 'warning', 'error'] as const)(
    'renders with variant=%s',
    (variant) => {
      render(<Badge variant={variant}>Test</Badge>);
      expect(screen.getByText('Test')).toBeInTheDocument();
    },
  );

  it('renders with size sm', () => {
    render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toBeInTheDocument();
  });
});

describe('Alert', () => {
  it.each(['info', 'success', 'warning', 'error'] as const)(
    'renders with variant=%s',
    (variant) => {
      render(<Alert variant={variant} title="Title" message="Message body" />);
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Message body')).toBeInTheDocument();
    },
  );

  it('renders with action', () => {
    render(<Alert variant="info" message="Message" action={<button>Action</button>} />);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    render(<Alert variant="info" message="Message body" />);
    expect(screen.queryByText('Message body')).toBeInTheDocument();
  });
});

describe('OrderStatusBadge', () => {
  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    completed: 'Completado',
    cancelled: 'Cancelado',
  };

  it.each(['pending', 'processing', 'completed', 'cancelled'] as const)(
    'renders with status=%s',
    (status) => {
      render(<OrderStatusBadge status={status} />);
      expect(screen.getByText(statusLabels[status]!)).toBeInTheDocument();
    },
  );

  it('renders with showIcon', () => {
    render(<OrderStatusBadge status="completed" showIcon />);
    expect(screen.getByText('Completado')).toBeInTheDocument();
    const badge = screen.getByText('Completado').parentElement;
    expect(badge?.querySelector('span')).toBeInTheDocument();
  });
});

describe('Skeleton', () => {
  it.each(['default', 'rounded', 'circular'] as const)('renders with variant=%s', (variant) => {
    render(<Skeleton variant={variant} className="h-4 w-32" />);
    expect(screen.getByLabelText('Cargando...')).toBeInTheDocument();
  });
});

describe('Spinner', () => {
  it.each(['sm', 'md', 'lg'] as const)('renders with size=%s', (size) => {
    render(<Spinner size={size} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Cargando...')).toBeInTheDocument();
  });
});

describe('LoadingState', () => {
  it('renders with default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingState message="Fetching data..." />);
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('renders spinner only when spinnerOnly is true', () => {
    render(<LoadingState spinnerOnly message="Test" />);
    expect(screen.getAllByLabelText('Cargando...').length).toBe(1);
  });
});

describe('ErrorState', () => {
  it('renders with default message', () => {
    render(<ErrorState />);
    expect(screen.getByText(/algo salió mal/i)).toBeInTheDocument();
  });

  it('renders with custom message and retry', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Custom error" retryLabel="Retry" onRetry={onRetry} />);
    expect(screen.getByText('Custom error')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders with config', () => {
    render(
      <EmptyState
        config={{
          title: 'Empty Title',
          description: 'Nothing here',
          actionLabel: 'Do something',
          actionHref: '/action',
        }}
      />,
    );
    expect(screen.getByText('Empty Title')).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Do something' })).toBeInTheDocument();
  });

  it('renders onAction callback', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        config={{
          title: 'Empty',
          actionLabel: 'Retry',
        }}
        onAction={onAction}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders default message when no config', () => {
    render(<EmptyState />);
    expect(screen.getByText('No hay contenido disponible.')).toBeInTheDocument();
  });
});
