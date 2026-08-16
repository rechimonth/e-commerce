import { type ReactNode } from 'react';
import type { AlertVariant } from '@/types/ui';

export interface AlertProps {
  readonly variant: AlertVariant;
  readonly title?: string;
  readonly message: string;
  readonly action?: ReactNode;
  readonly icon?: ReactNode;
}

const variantClasses: Record<AlertVariant, string> = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-success-500/10 text-success-700 border-success-500/30',
  warning: 'bg-warning-500/10 text-warning-700 border-warning-500/30',
  error: 'bg-error-500/10 text-error-700 border-error-500/30',
};

export function Alert({ variant, title, message, action, icon }: AlertProps) {
  return (
    <div
      className={`rounded-md border p-4 transition-colors duration-200 ${variantClasses[variant]}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 flex-shrink-0">{icon}</div>}
        <div className="flex-1">
          {title && <p className="text-sm font-semibold">{title}</p>}
          <p className="text-sm">{message}</p>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export default Alert;
