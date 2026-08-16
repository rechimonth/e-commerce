import { type HTMLAttributes } from 'react';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly color?: 'primary' | 'neutral' | 'error';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Spinner({ size = 'md', color = 'primary', className = '', ...rest }: SpinnerProps) {
  const colorClasses = {
    primary: 'border-t-primary-600',
    neutral: 'border-t-neutral-600',
    error: 'border-t-error-500',
  };

  const baseClasses =
    `animate-spin rounded-full border-2 border-neutral-200 ${colorClasses[color]} shadow-sm`;

  return (
    <div
      className={`${baseClasses} ${sizeClasses[size]} ${className}`.trim()}
      role="status"
      aria-label="Cargando..."
      {...rest}
    />
  );
}

export default Spinner;
