import { type ReactNode } from 'react';
import { Spinner } from './Spinner';

export interface LoadingStateProps {
  readonly message?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly spinnerOnly?: boolean;
  readonly icon?: ReactNode;
}

export function LoadingState({
  message = 'Cargando...',
  size = 'md',
  spinnerOnly = false,
  icon,
}: LoadingStateProps) {
  if (spinnerOnly) {
    return (
      <div className="flex items-center justify-center p-4" role="status" aria-label={message}>
        {icon ?? <Spinner size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'} />}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 p-8"
      role="status"
      aria-label={message}
    >
      {icon ?? <Spinner size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'} />}
      <p className="text-sm text-neutral-600">{message}</p>
    </div>
  );
}

export default LoadingState;
