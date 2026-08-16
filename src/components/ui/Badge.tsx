import { type HTMLAttributes } from 'react';
import type { BadgeVariant } from '@/types/ui';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: BadgeVariant;
  readonly size?: 'sm' | 'md';
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-success-500/10 text-success-700 border-success-500/30',
  warning: 'bg-warning-500/10 text-warning-700 border-warning-500/30',
  error: 'bg-error-500/10 text-error-700 border-error-500/30',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

const baseClasses =
  'inline-flex items-center rounded-full font-medium border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-1';

export function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </span>
  );
}

export default Badge;
