import { type ReactNode } from 'react';
import type { OrderStatus } from '@/types/order';
import type { BadgeVariant } from '@/types/ui';

export interface OrderStatusBadgeProps {
  readonly status: OrderStatus;
  readonly variant?: BadgeVariant;
  readonly size?: 'sm' | 'md';
  readonly showIcon?: boolean;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const statusColors: Record<OrderStatus, BadgeVariant> = {
  pending: 'warning',
  processing: 'default',
  completed: 'success',
  cancelled: 'error',
};

const colorClasses: Record<BadgeVariant, string> = {
  info: 'bg-info-500/10 text-info-700',
  default: 'bg-neutral-100 text-neutral-700',
  success: 'bg-success-500/10 text-success-700',
  warning: 'bg-warning-500/10 text-warning-700',
  error: 'bg-error-500/10 text-error-700',
};

export function OrderStatusBadge({
  status,
  variant,
  size = 'md',
  showIcon = false,
}: OrderStatusBadgeProps) {
  const badgeVariant = variant ?? statusColors[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}`}
    >
      {showIcon && <StatusIcon status={status} />}
      <span className={`rounded-full ${colorClasses[badgeVariant]}`}>{statusLabels[status]}</span>
    </span>
  );
}

function StatusIcon({ status }: { status: OrderStatus }) {
  const icons: Record<OrderStatus, ReactNode> = {
    pending: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    processing: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 16h5v5" />
      </svg>
    ),
    completed: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    cancelled: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6" />
        <path d="M9 9l6 6" />
      </svg>
    ),
  };
  return icons[status];
}

export default OrderStatusBadge;

