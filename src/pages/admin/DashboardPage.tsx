import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { DashboardStats } from '@/types/admin';
import { type ReactNode } from 'react';

interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly icon: ReactNode;
  readonly subtitle?: string;
}

function StatCard({ label, value, icon, subtitle }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <span className="text-3xl text-neutral-700">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          <p className="text-sm text-neutral-500">{label}</p>
          {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

export function AdminDashboardPage({ stats }: { readonly stats?: DashboardStats }) {
  const orderStatusCounts = stats?.orderStatusCounts ?? {
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
  };

  const pendingCount = stats?.pendingOrders ?? 0;
  const completedCount = stats?.completedOrders ?? 0;
  const totalProducts = stats?.totalProducts ?? 0;
  const totalRevenueCents = stats?.totalRevenue?.amount ?? 0;

  const revenueCurrency = stats?.totalRevenue?.currency ?? 'USD';

  const formattedRevenue = (totalRevenueCents / 100).toLocaleString('es-ES', {
    style: 'currency',
    currency: revenueCurrency,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Productos" value={totalProducts} icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0-3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        } subtitle="Total en catálogo" />
        <StatCard label="Ordenes pendientes" value={pendingCount} icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        } />
        <StatCard label="Ordenes completadas" value={completedCount} icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        } />
        <StatCard label="Ingresos totales" value={formattedRevenue} icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
            <path d="M4 9h8.5a2.5 2.5 0 0 1 0 5H4" />
            <path d="M8 9v9" />
            <path d="M20 15h-6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M16 15V6" />
          </svg>
        } subtitle="últimos 30 dias" />
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Estados de órdenes</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatusCard
            label="Pendiente"
            count={orderStatusCounts.pending}
            variant="warning"
          />
          <StatusCard
            label="Procesando"
            count={orderStatusCounts.processing}
            variant="default"
          />
          <StatusCard
            label="Completado"
            count={orderStatusCounts.completed}
            variant="success"
          />
          <StatusCard
            label="Cancelado"
            count={orderStatusCounts.cancelled}
            variant="error"
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/products">
            <Button variant="solid" size="sm">
              Gestionar productos
            </Button>
          </Link>
          <Link to="/admin/orders">
            <Button variant="outline" size="sm">
              Ver órdenes
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function StatusCard({
  label,
  count,
  variant,
}: {
  readonly label: string;
  readonly count: number;
  readonly variant: 'warning' | 'default' | 'success' | 'error';
}) {
  const variantClasses: Record<string, string> = {
    warning: 'bg-warning-500/10 text-warning-700 border-warning-200',
    default: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    success: 'bg-success-500/10 text-success-700 border-success-200',
    error: 'bg-error-500/10 text-error-700 border-error-200',
  };

  return (
    <div className={`rounded-lg border p-4 text-center ${variantClasses[variant as string]}`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-sm">{label}</p>
    </div>
  );
}

export default AdminDashboardPage;
