import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/ui/Navbar';
import { ROUTES } from '@/constants/routes';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { useFavorites } from '@/contexts/FavoritesContext';
import type { NavbarLink } from '@/components/ui/Navbar';

export function Header() {
  const { totalItems } = useCart();
  const { favoriteCount } = useFavorites();
  const { user, session, roleState, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const navLinks: NavbarLink[] = [{ label: 'Inicio', href: ROUTES.HOME }, { label: 'Catálogo', href: ROUTES.CATALOG }];
  const isAuthenticated = session !== null && roleState !== 'unauthenticated';

  if (isAuthenticated) navLinks.push({ label: 'Favoritos', href: ROUTES.FAVORITES });
  if (isAuthenticated && roleState === 'admin') navLinks.push({ label: 'Admin', href: ROUTES.ADMIN });

  const handleLogout = async () => {
    await signOut();
    navigate(ROUTES.HOME, { replace: true });
  };

  const confirmLogout = async () => {
    setLogoutConfirmationOpen(false);
    await handleLogout();
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `${ROUTES.CATALOG}?search=${encodeURIComponent(term)}` : ROUTES.CATALOG);
  };

  const rightContent = (
    <div className="flex items-center gap-2 sm:gap-3">
      <form onSubmit={handleSearch} className="hidden lg:block" role="search">
        <label className="sr-only" htmlFor="site-search">Buscar productos</label>
        <div className="flex h-10 w-64 items-center rounded-md border border-cyan-400/20 bg-slate-950/70 px-3 transition focus-within:border-cyan-300/70 focus-within:shadow-[0_0_18px_rgba(34,211,238,0.12)]">
          <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input id="site-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en ECOMMERCE AI" className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500" />
        </div>
      </form>
      <Link to={isAuthenticated ? ROUTES.FAVORITES : ROUTES.LOGIN} className="relative flex h-11 w-11 items-center justify-center rounded-md text-slate-300 transition hover:bg-fuchsia-400/10 hover:text-fuchsia-300" aria-label={isAuthenticated ? `Ver favoritos${favoriteCount > 0 ? `, ${favoriteCount} productos` : ''}` : 'Iniciar sesión para ver favoritos'}>
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>
        {isAuthenticated && favoriteCount > 0 && <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#05060d] bg-fuchsia-500 px-1 text-xs font-bold text-white">{favoriteCount}</span>}
      </Link>
      <Link to={ROUTES.CART} className="relative flex h-11 w-11 items-center justify-center rounded-md text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-300" aria-label={`Ver carrito${totalItems > 0 ? `, ${totalItems} productos` : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
        {totalItems > 0 && <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#05060d] bg-fuchsia-500 px-1 text-xs font-bold text-white shadow-[0_0_12px_rgba(244,114,182,0.6)]">{totalItems}</span>}
      </Link>
      {isLoading && roleState === 'loading' ? <Spinner size="sm" /> : isAuthenticated && user ? (
        <><span className="hidden text-sm font-semibold text-cyan-100 sm:inline-block">Hola, {user.displayName ?? user.email ?? 'Usuario'}</span><button onClick={() => setLogoutConfirmationOpen(true)} className="hidden h-11 px-2 text-sm font-semibold uppercase tracking-wider text-slate-400 transition hover:text-fuchsia-300 sm:inline-block">Salir</button></>
      ) : <Link to={ROUTES.LOGIN} className="flex h-11 items-center px-2 text-sm font-semibold uppercase tracking-wider text-slate-300 transition hover:text-cyan-300">Entrar</Link>}
    </div>
  );

  return (
    <>
      <Navbar brand={<>ECOMMERCE <span className="text-fuchsia-400">AI</span></>} links={navLinks} rightContent={rightContent} />
      <Modal
        isOpen={logoutConfirmationOpen}
        onClose={() => setLogoutConfirmationOpen(false)}
        title="¿Desea cerrar sesión?"
        description="Se cerrará la sesión de tu cuenta."
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setLogoutConfirmationOpen(false)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
            >
              No
            </button>
            <button
              type="button"
              onClick={() => void confirmLogout()}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
            >
              Sí
            </button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600">¿Deseas salir de tu cuenta ahora?</p>
      </Modal>
    </>
  );
}

export default Header;
