import { type ReactNode } from 'react';
import Button from './Button';
import type { EmptyStateConfig } from '@/types/ui';

export interface EmptyStateProps {
  readonly config?: EmptyStateConfig;
  readonly icon?: ReactNode;
  readonly onAction?: () => void;
}

export function EmptyState({ config, icon, onAction }: EmptyStateProps) {
  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-neutral-600">No hay contenido disponible.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      {icon && <div className="text-neutral-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-neutral-900">{config.title}</h3>
      {config.description && <p className="text-sm text-neutral-600">{config.description}</p>}
      {config.actionLabel && config.actionHref && (
        <Button asChild variant="solid">
          <a href={config.actionHref}>{config.actionLabel}</a>
        </Button>
      )}
      {config.actionLabel && onAction && (
        <Button variant="solid" onClick={onAction}>
          {config.actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
