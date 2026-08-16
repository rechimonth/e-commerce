import { type ChangeEvent } from 'react';
import Button from './Button';

export interface QuantitySelectorProps {
  readonly quantity: number;
  readonly min?: number;
  readonly max?: number;
  readonly onChange: (quantity: number) => void;
  readonly buttonSize?: 'sm' | 'md';
  readonly readOnly?: boolean;
  readonly disabled?: boolean;
  readonly showControls?: boolean;
}

export function QuantitySelector({
  quantity,
  min = 1,
  max = 99,
  onChange,
  buttonSize = 'sm',
  readOnly = false,
  disabled = false,
  showControls = true,
}: QuantitySelectorProps) {
  const decrement = () => {
    if (quantity > min && !disabled) {
      onChange(Math.max(min, quantity - 1));
    }
  };

  const increment = () => {
    if (quantity < max && !disabled) {
      onChange(Math.min(max, quantity + 1));
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!Number.isNaN(value)) {
      onChange(Math.max(min, Math.min(max, value)));
    }
  };

  if (readOnly || !showControls) {
    return <span className="text-lg font-medium">{quantity}</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size={buttonSize}
        onClick={decrement}
        disabled={disabled || quantity <= min}
        type="button"
      >
        −
      </Button>
      <input
        type="number"
        min={min}
        max={max}
        value={quantity}
        onChange={handleChange}
        disabled={disabled}
        className="w-12 border border-neutral-300 text-center text-sm transition-colors duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Cantidad"
      />
      <Button
        variant="outline"
        size={buttonSize}
        onClick={increment}
        disabled={disabled || quantity >= max}
        type="button"
      >
        +
      </Button>
    </div>
  );
}

export default QuantitySelector;
