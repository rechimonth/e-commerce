import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@/components/ui';

describe('Button', () => {
  it.each(['solid', 'outline', 'danger', 'link'] as const)('renders with variant=%s', (variant) => {
    render(<Button variant={variant}>Test</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Test');
  });

  it.each(['sm', 'md', 'lg'] as const)('renders with size=%s', (size) => {
    render(<Button size={size}>Test</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Test');
  });

  it('renders left and right icons', () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon" />}
        rightIcon={<span data-testid="right-icon" />}
      >
        Action
      </Button>,
    );
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('renders as non-button element when asChild is true', () => {
    render(<Button asChild>Test</Button>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Test</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Test
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
