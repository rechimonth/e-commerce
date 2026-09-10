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
  { label: 'Dashboard', href: ROUTES.ADMIN, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="12" rx="1" /></svg> },
  { label: 'Productos', href: ROUTES.ADMIN_PRODUCTS, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0-3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg> },
  { label: 'Categorías', href: ROUTES.ADMIN_CATEGORIES, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" /><path d="M4 12h16" /><path d="M12 4v16" /></svg> },
  { label: 'Órdenes', href: ROUTES.ADMIN_ORDERS, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg> },
  { label: 'Usuarios', href: ROUTES.ADMIN_USERS, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
  { label: 'Media', href: ROUTES.ADMIN_UPLOADS, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg> },
  { label: 'Analytics', href: ROUTES.ADMIN_ANALYTICS, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 6-6" /></svg> },
  { label: 'Auditoría', href: ROUTES.ADMIN_AUDIT, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg> },
  { label: 'Configuración', href: ROUTES.ADMIN_SETTINGS, icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate(ROUTES.LOGIN);
  };

  const isActivePath = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-theme cyber-app-shell min-h-screen bg-[#05060d] text-slate-100" data-testid="admin-shell">
      <div className="cyber-grid" aria-hidden="true" />
      <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-cyan-300/15 bg-slate-950/90 shadow-[12px_0_60px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all md:flex md:flex-col ${collapsed ? 'w-20' : 'w-64'}`} data-testid="admin-sidebar">
        <AdminSidebar navItems={adminNavItems} isActivePath={isActivePath} onLogout={handleLogout} user={user} collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 flex md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeSidebar} />
          <aside className="w-64 overflow-y-auto border-r border-cyan-300/15 bg-slate-950/95 shadow-2xl">
            <AdminSidebar navItems={adminNavItems} isActivePath={isActivePath} onLogout={handleLogout} user={user} onClose={closeSidebar} />
          </aside>
        </div>
      )}

      <div className={`relative z-10 flex-1 transition-all ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <AdminHeader />
        <main className="p-4 sm:p-6 lg:p-7"><Outlet /></main>
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
  readonly collapsed?: boolean;
  readonly onToggleCollapse?: () => void;
}

function AdminSidebar({ navItems, isActivePath, onLogout, user, onClose, collapsed, onToggleCollapse }: AdminSidebarProps) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-cyan-300/15 px-5 py-5">
        {!collapsed && <><p className="cyber-kicker">ECOMMERCE AI</p><h1 className="mt-1 font-display text-lg font-bold tracking-wide text-white">PANEL ADMIN</h1></>}
        {user && !collapsed && <p className="mt-2 truncate text-sm text-slate-400" data-testid="user-display-name">{user.displayName ?? user.email ?? 'Usuario'}</p>}
        {collapsed && <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 font-display text-sm font-black text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.16)]">EA</div>}
      </div>

      <nav className="flex-1 space-y-1.5 p-3">
        {navItems.map((item) => {
          const active = isActivePath(item.href);
          return (
            <a key={item.href} href={item.href} onClick={onClose} title={collapsed ? item.label : undefined} className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${active ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200 shadow-[inset_3px_0_0_#22d3ee,0_0_22px_rgba(34,211,238,0.08)]' : 'border-transparent text-slate-400 hover:border-cyan-300/10 hover:bg-white/[0.03] hover:text-slate-100'}`} data-testid={`nav-link-${item.label.toLowerCase()}`}>
              <span className={active ? 'text-cyan-300' : 'text-slate-500 group-hover:text-cyan-200'}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </a>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-cyan-300/15 p-3">
        {onToggleCollapse && <button type="button" onClick={onToggleCollapse} title={collapsed ? 'Expandir' : 'Contraer'} className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:border-cyan-300/10 hover:bg-white/[0.03] hover:text-cyan-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}><path d="m15 18-6-6 6-6" /></svg>
          {!collapsed && <span>Contraer panel</span>}
        </button>}
        <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl border border-red-400/10 px-3 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:border-red-400/20 hover:bg-red-500/5 hover:text-red-300" data-testid="logout-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );
}

function AdminHeader() {
  return (
    <header className="sticky top-0 z-20 hidden items-center border-b border-cyan-300/10 bg-slate-950/75 px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl md:flex">
      <div>
        <p className="cyber-kicker">CONTROL SURFACE</p>
        <h2 className="font-display text-sm font-bold tracking-wide text-slate-100">ADMIN OPERATIONS</h2>
      </div>
    </header>
  );
}

export default AdminLayout;
