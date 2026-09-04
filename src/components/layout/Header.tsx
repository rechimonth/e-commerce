import { useState } from 'react';
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
  const [search, setSearch] = useState('');

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

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `${ROUTES.CATALOG}?search=${encodeURIComponent(term)}` : ROUTES.CATALOG);
  };

  const rightContent = (
    <div className="flex items-center gap-2 sm:gap-3">
      <form onSubmit={handleSearch} className="hidden lg:block" role="search">
        <label className="sr-only" htmlFor="site-search">Buscar productos</label>
        <div className="flex h-10 w-64 items-center rounded-md border border-cyan-400/20 bg-slate-950/70 px-3 transition focus-within:border-cyan-300/70 focus-within:shadow-[0_0_18px_rgba(34,211,238,0.12)]">
          <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
          </svg>
          <input
            id="site-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar en ECOMMERCE AI"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>
      </form>

      <Link
        to={ROUTES.CART}
        className="relative flex h-11 w-11 items-center justify-center rounded-md text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-300"
        aria-label={`Ver carrito${totalItems > 0 ? `, ${totalItems} productos` : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#05060d] bg-fuchsia-500 px-1 text-xs font-bold text-white shadow-[0_0_12px_rgba(244,114,182,0.6)]">
            {totalItems}
          </span>
        )}
      </Link>

      {isLoading && roleState === 'loading' ? (
        <Spinner size="sm" />
      ) : isAuthenticated && user ? (
        <>
          <span className="hidden text-sm font-semibold text-cyan-100 sm:inline-block">
            Hola, {user.displayName ?? user.email ?? 'Usuario'}
          </span>
          <button onClick={handleLogout} className="hidden h-11 px-2 text-sm font-semibold uppercase tracking-wider text-slate-400 transition hover:text-fuchsia-300 sm:inline-block">
            Salir
          </button>
        </>
      ) : (
        <Link to={ROUTES.LOGIN} className="flex h-11 items-center px-2 text-sm font-semibold uppercase tracking-wider text-slate-300 transition hover:text-cyan-300">
          Entrar
        </Link>
      )}
    </div>
  );

  return <Navbar brand={<>ECOMMERCE <span className="text-fuchsia-400">AI</span></>} links={navLinks} rightContent={rightContent} />;
}

export default Header;
