import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { ButtonVariant, ButtonSize } from '@/types/ui';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly leftIcon?: ReactNode;
  readonly rightIcon?: ReactNode;
  readonly asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  solid: 'bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-200 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.14)] hover:shadow-[0_0_26px_rgba(34,211,238,0.25)] transition-all duration-200',
  ghost: 'text-slate-300 hover:bg-white/5 hover:text-cyan-200 shadow-none',
  outline: 'border border-cyan-400/25 bg-transparent hover:bg-cyan-400/10 hover:border-cyan-300/50 text-cyan-100 transition-all duration-200',
  danger: 'bg-red-500 hover:bg-red-400 active:bg-red-300 text-white shadow-[0_0_18px_rgba(239,68,68,0.16)] transition-all duration-200',
  link: 'text-cyan-300 hover:text-white underline-offset-4 hover:underline p-0 shadow-none',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 text-sm',
  md: 'min-h-11 px-4 text-base',
  lg: 'min-h-12 px-6 text-lg',
};

export function Button({ variant = 'solid', size = 'md', leftIcon, rightIcon, asChild = false, className = '', disabled, children, ...rest }: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();

  if (asChild) {
    if (!isValidElement(children)) throw new Error('Button asChild requiere un único elemento React hijo.');
    const childProps = children.props as { className?: string; [key: string]: unknown };
    return cloneElement(children, { ...rest, className: `${classes} ${childProps.className ?? ''}`.trim(), ...(disabled ? { 'aria-disabled': true } : {}) } as never);
  }

  return <button className={classes} disabled={disabled} {...rest}>{leftIcon && <span className="mr-2 flex-shrink-0">{leftIcon}</span>}{children}{rightIcon && <span className="ml-2 flex-shrink-0">{rightIcon}</span>}</button>;
}

export default Button;
