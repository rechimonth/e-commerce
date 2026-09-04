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
  const baseInputClasses = 'min-h-11 w-full rounded-md border border-cyan-400/20 bg-slate-950/75 px-3 py-2 text-base text-slate-100 shadow-sm transition placeholder:text-slate-500 focus-visible:border-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/20 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50';
  const inputClasses = `${baseInputClasses} ${error ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20' : ''} ${className}`.trim();

  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-slate-300">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400">{icon}</span>}
        <input id={inputId} className={`${inputClasses} ${icon ? 'pl-10' : ''}`} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? errorId : helperText ? helperId : undefined} {...rest} />
      </div>
      {error && <p id={errorId} className="mt-1.5 text-sm text-red-300">{error}</p>}
      {helperText && !error && <p id={helperId} className="mt-1.5 text-sm text-slate-500">{helperText}</p>}
    </div>
  );
}

export default Input;
