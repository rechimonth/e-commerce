import { type TextareaHTMLAttributes, useId } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
}

export function Textarea({ label, error, helperText, className = '', id, ...rest }: TextareaProps) {
  const generatedId = useId(); const textareaId = id ?? generatedId;;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;

  const baseClasses =
    'w-full rounded-md border border-neutral-300 px-3 py-2 text-base transition-colors placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 resize-y';

  const textareaClasses = `${baseClasses} ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''} ${className}`.trim();

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-1 block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={textareaClasses}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-error-500">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-neutral-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

export default Textarea;
