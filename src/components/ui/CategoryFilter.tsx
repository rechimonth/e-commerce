import type { ProductCategory } from '@/types/domain';

export interface CategoryFilterProps {
  readonly categories: ReadonlyArray<{
    readonly id: ProductCategory;
    readonly label: string;
    readonly count?: number;
  }>;
  readonly selected: ProductCategory | 'all';
  readonly onSelect: (category: ProductCategory | 'all') => void;
  readonly showCounts?: boolean;
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
  showCounts = false,
}: CategoryFilterProps) {
  return (
    <nav className="flex flex-wrap gap-2" role="navigation" aria-label="Filtrar por categoría">
      <button
        onClick={() => onSelect('all')}
        className={`rounded-md border px-4 py-2 text-sm font-medium transition-all duration-200 ${
          selected === 'all'
            ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
            : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
        }`}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`rounded-md border px-4 py-2 text-sm font-medium transition-all duration-200 ${
            selected === cat.id
              ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
              : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
          }`}
        >
          {cat.label}
          {showCounts && cat.count !== undefined && (
            <span className="ml-2 text-xs text-neutral-500">({cat.count})</span>
          )}
        </button>
      ))}
    </nav>
  );
}

export default CategoryFilter;
