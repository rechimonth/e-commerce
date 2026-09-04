import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export interface NavbarLink {
  readonly label: string;
  readonly href: string;
}

export interface NavbarProps {
  readonly brand: ReactNode;
  readonly links?: ReadonlyArray<NavbarLink>;
  readonly rightContent?: ReactNode;
  readonly onLinkClick?: (href: string) => void;
}

export function Navbar({ brand, links, rightContent, onLinkClick }: NavbarProps) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-400/20 bg-[#05060d]/90 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-2">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            to={ROUTES.HOME}
            onClick={() => onLinkClick?.(ROUTES.HOME)}
            className="font-display shrink-0 text-base font-black tracking-[0.12em] text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.55)] transition hover:text-white sm:text-xl"
          >
            {brand}
          </Link>
          {links && (
            <div className="hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => onLinkClick?.(link.href)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-[0.08em] transition ${
                    location.pathname === link.href
                      ? 'bg-cyan-400/10 text-cyan-300 shadow-[inset_0_-2px_0_rgba(34,211,238,0.8)]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-cyan-200'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}
      </nav>
    </header>
  );
}

export default Navbar;
