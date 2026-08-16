import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { ButtonVariant, ButtonSize } from '@/types/ui';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly leftIcon?: ReactNode;
  readonly rightIcon?: ReactNode;
  readonly asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  solid: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-sm hover:shadow-md transition-all duration-200',
  ghost: 'text-neutral-700 hover:bg-neutral-100 shadow-none',
  outline: 'border border-neutral-300 bg-white hover:bg-neutral-50 hover:border-neutral-400 text-neutral-700 transition-all duration-200',
  danger: 'bg-error-500 hover:bg-error-600 active:bg-error-700 text-white shadow-sm hover:shadow-md transition-all duration-200',
  link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline p-0 shadow-none',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
};

export function Button({
  variant = 'solid',
  size = 'md',
  leftIcon,
  rightIcon,
  asChild = false,
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

  const classes =
    `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();

  if (asChild) {
    return (
      <span className={classes} {...(disabled && { 'aria-disabled': true })}>
        {leftIcon && <span className="mr-2 flex-shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2 flex-shrink-0">{rightIcon}</span>}
      </span>
    );
  }

  return (
    <button className={classes} disabled={disabled} {...rest}>
      {leftIcon && <span className="mr-2 flex-shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2 flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}

export default Button;
