import { type InputHTMLAttributes, type ReactNode, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly icon?: ReactNode;
}

export function Input({ label, error, helperText, icon, className = '', id, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const baseInputClasses =
    'w-full rounded-md border border-neutral-300 px-3 py-2 text-base shadow-sm transition-colors duration-200 placeholder-neutral-400 focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const inputClasses = `${baseInputClasses} ${error ? 'border-error-500 focus-visible:border-error-500 focus-visible:ring-error-500/20' : ''} ${className}`.trim();

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">{icon}</span>
        )}
        <input
          id={inputId}
          className={`${inputClasses} ${icon ? 'pl-10' : ''}`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...rest}
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-error-500">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-sm text-neutral-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

export default Input;
