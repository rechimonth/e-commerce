import { Input } from '@/components/ui';

export interface ProductSearchProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}

export function ProductSearch({
  value,
  onChange,
  placeholder = 'Buscar productos...',
  ...rest
}: ProductSearchProps) {
  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      icon={
        <svg
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
      }
      {...rest}
    />
  );
}

export default ProductSearch;
