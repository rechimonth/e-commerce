import { type SelectHTMLAttributes, useId } from 'react';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly options: readonly SelectOption[];
  readonly placeholder?: string;
}

export function Select({
  label,
  error,
  helperText,
  options,
  placeholder = 'Seleccionar...',
  className = '',
  id,
  ...rest
}: SelectProps) {
  const generatedId = useId(); const selectId = id ?? generatedId;;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  const baseClasses =
    'w-full rounded-md border border-neutral-300 px-3 py-2 text-base transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50';

  const selectClasses = `${baseClasses} ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''} ${className}`.trim();

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={selectClasses}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
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

export default Select;
