import { type InputHTMLAttributes, useId } from 'react';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly error?: string;
}

export function Checkbox({ label, error, className = '', id, ...rest }: CheckboxProps) {
  const generatedId = useId(); const checkboxId = id ?? generatedId;;
  const errorId = `${checkboxId}-error`;

  return (
    <div className="flex items-start">
      <div className="flex h-5 items-center">
        <input
          id={checkboxId}
          type="checkbox"
          className={`h-4 w-4 cursor-pointer rounded border-neutral-300 text-primary-600 focus:ring-primary-500 ${error ? 'border-error-500' : ''} ${className}`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
      </div>
      {label && (
        <label htmlFor={checkboxId} className="ml-2 block text-sm text-neutral-700">
          {label}
        </label>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-error-500">
          {error}
        </p>
      )}
    </div>
  );
}

export default Checkbox;
