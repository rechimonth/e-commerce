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
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            to={ROUTES.HOME}
            onClick={() => onLinkClick?.(ROUTES.HOME)}
            className="text-xl font-bold text-primary-700"
          >
            {brand}
          </Link>
          {links &&
            links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => onLinkClick?.(link.href)}
                className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                  location.pathname === link.href ? 'text-primary-600' : 'text-neutral-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
        </div>
        {rightContent && <div className="flex items-center gap-3">{rightContent}</div>}
      </nav>
    </header>
  );
}

export default Navbar;
