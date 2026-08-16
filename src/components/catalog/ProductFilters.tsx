import { CategoryFilter } from '@/components/ui';
import type { ProductCategory } from '@/types/domain';

export interface CategoryOption {
  readonly id: ProductCategory;
  readonly label: string;
  readonly count?: number;
}

export interface ProductFiltersProps {
  readonly categories: readonly CategoryOption[];
  readonly selected: ProductCategory | 'all';
  readonly onSelect: (category: ProductCategory | 'all') => void;
  readonly showCounts?: boolean;
}

const DEFAULT_CATEGORIES: readonly CategoryOption[] = [
  { id: 'electronics', label: 'Electrónicos' },
  { id: 'clothing', label: 'Ropa' },
  { id: 'books', label: 'Libros' },
  { id: 'home', label: 'Hogar' },
  { id: 'sports', label: 'Deportes' },
];

export function ProductFilters({
  categories = DEFAULT_CATEGORIES,
  selected,
  onSelect,
  showCounts = false,
}: ProductFiltersProps) {
  return (
    <CategoryFilter
      categories={Array.from(categories)}
      selected={selected}
      onSelect={onSelect}
      showCounts={showCounts}
    />
  );
}

export default ProductFilters;
