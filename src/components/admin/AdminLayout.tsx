import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';

interface AdminNavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: ReactNode;
}

const adminNavItems: AdminNavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.ADMIN,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="12" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Productos',
    href: ROUTES.ADMIN_PRODUCTS,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0-3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    label: 'Órdenes',
    href: ROUTES.ADMIN_ORDERS,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
    ),
  },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate(ROUTES.LOGIN);
  };

  const isActivePath = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-64 overflow-y-auto border-r border-neutral-200 bg-white md:flex md:flex-col"
        data-testid="admin-sidebar"
      >
        <AdminSidebar
          navItems={adminNavItems}
          isActivePath={isActivePath}
          onLogout={handleLogout}
          user={user}
        />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeSidebar}
          />
          <aside className="w-64 overflow-y-auto border-r border-neutral-200 bg-white">
            <AdminSidebar
              navItems={adminNavItems}
              isActivePath={isActivePath}
              onLogout={handleLogout}
              user={user}
              onClose={closeSidebar}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 md:ml-64">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

interface AdminSidebarProps {
  readonly navItems: AdminNavItem[];
  readonly isActivePath: (href: string) => boolean;
  readonly onLogout: () => void;
  readonly user: { displayName: string | null; email: string | null } | null;
  readonly onClose?: () => void;
}

function AdminSidebar({ navItems, isActivePath, onLogout, user, onClose }: AdminSidebarProps) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h1 className="text-xl font-bold text-neutral-900">Panel Admin</h1>
        {user && (
          <p className="mt-1 text-sm text-neutral-500" data-testid="user-display-name">
            {user.displayName ?? user.email ?? 'Usuario'}
          </p>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const active = isActivePath(item.href);
          const baseClasses =
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors';
          const activeClasses =
            'bg-primary-50 text-primary-700';
          const inactiveClasses =
            'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900';

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
              data-testid={`nav-link-${item.label.toLowerCase()}`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          data-testid="logout-button"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

interface AdminHeaderProps {
  readonly onMenuClick: () => void;
}

function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-10 hidden items-center justify-between border-b border-neutral-200 bg-white px-6 py-3 md:flex">
      <h1 className="text-lg font-semibold text-neutral-900">Admin</h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default AdminLayout;
