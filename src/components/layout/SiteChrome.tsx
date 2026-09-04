import { useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import type { ReactNode } from 'react';

interface SiteChromeProps {
  readonly children: ReactNode;
}

export function SiteChrome({ children }: SiteChromeProps) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="cyber-app-shell">
      <div className="cyber-grid" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        {!isAdmin && <Footer />}
      </div>
    </div>
  );
}

export default SiteChrome;
