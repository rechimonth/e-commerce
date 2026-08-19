import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { roleState, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading || roleState === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Cargando…</div>;
  }

  if (roleState === 'unauthenticated') {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }

  if (roleState !== 'admin') {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return <>{children}</>;
}

