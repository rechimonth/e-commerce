import { type HTMLAttributes } from 'react';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  readonly size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  readonly as?: 'div' | 'main' | 'section' | 'article';
  readonly padded?: boolean;
}

const sizeClasses: Record<'sm' | 'md' | 'lg' | 'xl' | 'full', string> = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-none',
};

export function Container({
  size = 'lg',
  as = 'div',
  padded = true,
  className = '',
  children,
  ...rest
}: ContainerProps) {
  const Tag = as;
  const paddingClass = padded ? 'px-4 sm:px-6 lg:px-8' : 'px-0';
  const classes = `${sizeClasses[size]} mx-auto ${paddingClass} ${className}`.trim();

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export default Container;
