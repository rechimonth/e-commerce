import { type InputHTMLAttributes, type ChangeEvent } from 'react';

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly placeholder?: string;
  readonly onSearch?: (value: string) => void;
  readonly debounceMs?: number;
}

export function SearchInput({
  placeholder = 'Buscar...',
  onSearch,
  debounceMs = 300,
  className = '',
  onChange,
  ...rest
}: SearchInputProps) {
  const debouncedSearch = (fn: (value: string) => void, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(value), delay);
    };
  };

  const handleSearch = onSearch ? debouncedSearch(onSearch, debounceMs) : null;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleSearch?.(e.target.value);
    onChange?.(e);
  };

  return (
    <div className="relative">
      <input
        type="search"
        placeholder={placeholder}
        onChange={handleChange}
        className={`w-full rounded-md border border-neutral-300 px-3 py-2 pl-10 text-base transition-colors duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${className}`}
        {...rest}
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="15.637" y2="15.637" />
      </svg>
    </div>
  );
}

export default SearchInput;
