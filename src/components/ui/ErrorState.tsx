import { type ReactNode } from 'react';
import Button from './Button';

export interface ErrorStateProps {
  readonly message?: string;
  readonly retryLabel?: string;
  readonly onRetry?: () => void;
  readonly icon?: ReactNode;
}

export function ErrorState({
  message = 'Algo salió mal. Por favor, intenta de nuevo.',
  retryLabel = 'Reintentar',
  onRetry,
  icon,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      {icon && <div className="text-error-500">{icon}</div>}
      <p className="text-sm text-neutral-600">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
