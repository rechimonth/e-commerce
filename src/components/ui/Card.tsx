import { type HTMLAttributes, type ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: 'default' | 'outlined' | 'interactive';
  readonly header?: ReactNode;
  readonly footer?: ReactNode;
  readonly padded?: boolean;
}

const variantClasses: Record<'default' | 'outlined' | 'interactive', string> = {
  default: 'bg-white border border-neutral-200 shadow-sm',
  outlined: 'bg-white border-2 border-neutral-300',
  interactive: 'bg-white border border-neutral-200 shadow-sm hover:shadow-lg hover:border-neutral-300 transition-all duration-200',
};

export function Card({
  variant = 'default',
  header,
  footer,
  padded = true,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div className={`rounded-lg ${variantClasses[variant]} ${className}`.trim()} {...rest}>
      {header && <div className="border-b border-neutral-100 px-6 py-5">{header}</div>}
      <div className={`${padded ? 'p-6' : 'p-0'}`}>{children}</div>
      {footer && <div className="border-t border-neutral-100 px-6 py-4">{footer}</div>}
    </div>
  );
}

export default Card;
