import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly size?: 'sm' | 'md' | 'lg' | 'xl';
  readonly variant?: 'default' | 'admin';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  variant = 'default',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const titleId = `modal-title-${title.replace(/\s+/g, '-')}`;
  const descId = description ? `modal-desc-${title.replace(/\s+/g, '-')}` : undefined;
  const isAdmin = variant === 'admin';

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md transition-opacity ${isAdmin ? 'admin-modal' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div
        className={`relative mx-3 w-full ${sizeClasses[size]} overflow-hidden rounded-2xl ${isAdmin ? 'border border-cyan-300/20 bg-slate-950/95 text-slate-100 shadow-[0_24px_90px_rgba(0,0,0,0.55),0_0_50px_rgba(34,211,238,0.08)] backdrop-blur-2xl' : 'bg-white shadow-xl'} transition-all duration-200 sm:mx-0`}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className={`flex items-start justify-between p-6 ${isAdmin ? 'border-b border-cyan-300/10 bg-slate-900/65' : ''}`}>
          <div className="flex-1">
            {isAdmin && <p className="cyber-kicker mb-1">ADMIN OVERLAY</p>}
            <h2 id={titleId} className={`text-xl font-semibold ${isAdmin ? 'font-display tracking-wide text-white' : 'text-neutral-900'}`}>
              {title}
            </h2>
            {description && (
              <p id={descId} className={`mt-2 text-sm ${isAdmin ? 'text-slate-400' : 'text-neutral-600'}`}>
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={`ml-4 rounded-lg p-2 transition-colors ${isAdmin ? 'text-slate-500 hover:bg-cyan-300/5 hover:text-cyan-200' : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600'}`}
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6">{children}</div>
        {footer && <div className={`border-t px-6 py-4 ${isAdmin ? 'border-cyan-300/10 bg-slate-900/50' : 'border-neutral-200'}`}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
