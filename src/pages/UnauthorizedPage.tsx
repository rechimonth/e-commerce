import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">403</h1>
        <p className="text-neutral-600 mb-2">Acceso denegado</p>
        <p className="text-neutral-500 mb-6">No tienes permisos para acceder a esta página.</p>
        <Link
          to={ROUTES.HOME}
          className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors inline-block"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
