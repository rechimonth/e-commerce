/**
 * Header — barra de navegación superior con usuario, carrito y navegación.
 *
 * Separado de AuthContext: usa useAuth() para leer el estado.
 * Solo mustramos links de admin cuando roleState === 'admin'.
 */
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/ui/Navbar';
import { ROUTES } from '@/constants/routes';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui';
import type { NavbarLink } from '@/components/ui/Navbar';

export function Header() {
  const { totalItems } = useCart();
  const { user, session, roleState, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const navLinks: NavbarLink[] = [
    { label: 'Inicio', href: ROUTES.HOME },
    { label: 'Catálogo', href: ROUTES.CATALOG },
  ];

  const isAuthenticated = session !== null && roleState !== 'unauthenticated';

  if (isAuthenticated && roleState === 'admin') {
    navLinks.push({ label: 'Admin', href: ROUTES.ADMIN });
  }

  const handleLogout = () => {
    void signOut();
    void navigate(ROUTES.HOME);
  };

  const rightContent = (
    <div className="flex items-center gap-3">
      <Link
        to={ROUTES.CART}
        className="relative p-2 text-neutral-600 hover:text-neutral-900"
        aria-label="Ver carrito"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current" aria-hidden="true">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white">
            {totalItems}
          </span>
        )}
      </Link>

      {isLoading && roleState === 'loading' ? (
        <Spinner size="sm" />
      ) : isAuthenticated && user ? (
        <>
          <span className="hidden text-sm text-neutral-700 sm:inline-block">
            Hola, {user.displayName ?? user.email ?? 'Usuario'}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Salir
          </button>
        </>
      ) : (
        <Link
          to={ROUTES.LOGIN}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          Iniciar sesión
        </Link>
      )}
    </div>
  );

  return <Navbar brand="E-Commerce AI" links={navLinks} rightContent={rightContent} />;
}

export default Header;
