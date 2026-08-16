import { type HTMLAttributes } from 'react';
import type { SkeletonVariant } from '@/types/ui';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: SkeletonVariant;
  readonly width?: string | number;
  readonly height?: string | number;
}

const variantClasses: Record<SkeletonVariant, string> = {
  default: 'rounded-md',
  rounded: 'rounded-full',
  circular: 'rounded-full',
};

export function Skeleton({
  variant = 'default',
  width = 'w-full',
  height = 'h-4',
  className = '',
  style,
  ...rest
}: SkeletonProps) {
  const sizeClass = variant === 'circular' ? 'aspect-square w-full rounded-full' : `${width} ${height}`;

  return (
    <div
      className={`animate-pulse bg-neutral-200 ${variantClasses[variant]} ${sizeClass} ${className}`.trim()}
      style={style}
      aria-label="Cargando..."
      {...rest}
    />
  );
}

export default Skeleton;
