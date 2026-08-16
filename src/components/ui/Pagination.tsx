export interface PaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly siblingCount?: number;
  readonly showIcons?: boolean;
}

export function CursorControls({
  hasMore,
  isLoading,
  onNext,
  onPrevious,
  canGoPrevious,
}: {
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly onNext: () => void;
  readonly onPrevious: () => void;
  readonly canGoPrevious: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious || isLoading}
        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Anterior
      </button>
      <button
        onClick={onNext}
        disabled={!hasMore || isLoading}
        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Siguiente
      </button>
    </div>
  );
}

export default CursorControls;
