export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex min-h-screen items-center justify-center" role="status">
      <div
        className={`animate-spin rounded-full border-2 border-primary-600 border-t-transparent ${sizeClasses[size]}`}
      />
    </div>
  );
}
