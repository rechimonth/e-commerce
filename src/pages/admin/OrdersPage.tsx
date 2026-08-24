import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Price } from '@/components/ui/Price';
import { ordersService } from '@/services/ordersService';
import { exportToCsv } from '@/utils/export';
import { canTransition } from '@/types/order';
import type { Order, OrderStatus } from '@/types/order';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';
import type { ReactNode } from 'react';

type StatusFilter = 'all' | OrderStatus;
type DateRangeFilter = 'all' | 'today' | 'week' | 'month';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'processing', label: 'Procesando' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];

const PAYMENT_METHODS = [
  { value: 'all', label: 'Todos' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'cash', label: 'Contra reembolso' },
];

const DATE_RANGE_FILTERS: { value: DateRangeFilter; label: string }[] = [
  { value: 'all', label: 'Todas las fechas' },
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
];

interface KpiCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly icon: ReactNode;
  readonly subtitle?: string;
  readonly trend?: { value: number; label: string };
}

function KpiCard({ label, value, icon, subtitle, trend }: KpiCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-3xl text-neutral-700">{icon}</span>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
            <p className="text-sm text-neutral-500">{label}</p>
            {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
    </Card>
  );
}

interface BulkActionBarProps {
  readonly selectedCount: number;
  readonly onClear: () => void;
  readonly onBulkComplete: () => void;
  readonly onBulkDelete: () => void;
  readonly isBulkProcessing: boolean;
}

function BulkActionBar({ selectedCount, onClear, onBulkComplete, onBulkDelete, isBulkProcessing }: BulkActionBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <Card className="flex items-center gap-3 px-4 py-3 shadow-lg border-primary-200">
        <span className="text-sm font-medium text-neutral-700">
          {selectedCount} seleccionada{selectedCount !== 1 ? 's' : ''}
        </span>
        <div className="h-6 w-px bg-neutral-200" />
        <Button variant="solid" size="sm" onClick={onBulkComplete} disabled={isBulkProcessing}>
          {isBulkProcessing ? 'Actualizando...' : 'Marcar completadas'}
        </Button>
        <Button variant="danger" size="sm" onClick={onBulkDelete} disabled={isBulkProcessing}>
          Eliminar seleccionadas
        </Button>
        <Button variant="outline" size="sm" onClick={onClear}>
          Cancelar
        </Button>
      </Card>
    </div>
  );
}

function OrderActionsDropdown({ order, onViewDetail }: { order: Order; onViewDetail: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
            <Link to={`/admin/orders/${order.id}`}>
              <button
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={() => setOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Ver detalle
              </button>
            </Link>
            <button
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => { setOpen(false); onViewDetail(); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <path d="M6 14h12v8H6z" />
              </svg>
              Imprimir etiqueta
            </button>
            <button
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => setOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar orden
            </button>
            <div className="my-1 h-px bg-neutral-100" />
            <button
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={() => setOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Eliminar orden
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function isInDateRange(date: Date, range: DateRangeFilter): boolean {
  if (range === 'all') return true;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'today') {
    return date >= startOfDay;
  }
  if (range === 'week') {
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    return date >= startOfWeek;
  }
  if (range === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return date >= startOfMonth;
  }
  return true;
}

export function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<ServiceError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusSelectValues, setStatusSelectValues] = useState<Record<string, string>>({});
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const fetchOrders = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const filters: { status?: OrderStatus; limit?: number } = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      filters.limit = 50;
      const result = await ordersService.fetchAllOrders(filters);
      setOrders(result);
      setStatus('success');
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al cargar órdenes',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setError(err);
      setStatus('error');
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleExport = () => {
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'userId', label: 'Usuario' },
      { key: 'createdAt', label: 'Fecha' },
      { key: 'total', label: 'Total' },
      { key: 'status', label: 'Estado' },
      { key: 'paymentMethod', label: 'Pago' },
    ];
    const rows = filteredOrders.map((o) => ({
      id: o.id.slice(-8),
      userId: o.userId,
      createdAt: o.createdAt.toLocaleDateString('es-ES'),
      total: `${o.pricing.total.currency} ${o.pricing.total.amount}`,
      status: o.status,
      paymentMethod: o.paymentMethod,
    }));
    exportToCsv('ordenes', rows, columns);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      if (!user) throw new Error('Usuario administrador no autenticado');
      const updated = await ordersService.updateOrderStatus(orderId, newStatus, user.uid);
      if (updated) {
        setOrders((prev) =>
          prev ? prev.map((o) => (o.id === orderId ? updated : o)) : prev,
        );
        setStatusSelectValues((prev) => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
      } else {
        void fetchOrders();
      }
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al actualizar estado',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setError(err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(new Set(filteredOrders.map((o) => o.id)));
    } else {
      setSelectedOrderIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkComplete = async () => {
    if (selectedOrderIds.size === 0 || !user) return;
    setIsBulkProcessing(true);
    try {
      await Promise.all([...selectedOrderIds].map((id) => ordersService.updateOrderStatus(id, 'completed', user.uid)));
      setSelectedOrderIds(new Set());
      void fetchOrders();
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al actualizar órdenes',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setError(err);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      setOrders((prev) => prev ? prev.filter((o) => !selectedOrderIds.has(o.id)) : prev);
      setSelectedOrderIds(new Set());
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al eliminar órdenes',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setError(err);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setDateRangeFilter('all');
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.paymentMethod === paymentFilter;
      const matchesDate = isInDateRange(order.createdAt, dateRangeFilter);
      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, dateRangeFilter]);

  const getAvailableStatusTransitions = (current: OrderStatus): OrderStatus[] => {
    return (['pending', 'processing', 'completed', 'cancelled'] as const)
      .filter((status) => canTransition(current, status));
  };

  const kpiData = useMemo(() => {
    const allOrders = orders ?? [];
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayOrders = allOrders.filter((o) => o.createdAt >= todayStart);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.pricing.total.amount, 0);
    const inProcess = allOrders.filter((o) => o.status === 'processing').length;
    const pending = allOrders.filter((o) => o.status === 'pending').length;
    return {
      todayOrders: todayOrders.length,
      todayRevenue,
      inProcess,
      pending,
    };
  }, [orders]);

  if (status === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === 'error' && error) {
    return <ErrorState message={error.message} onRetry={fetchOrders} />;
  }

  const isAllFilteredSelected = filteredOrders.length > 0 && selectedOrderIds.size === filteredOrders.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Órdenes</h1>
        <div className="flex items-center gap-2">
          <Link to="/admin/orders/new">
            <Button variant="solid" size="md">
              Crear orden
            </Button>
          </Link>
          <Button variant="outline" size="md" onClick={handleExport}>
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Órdenes hoy"
          value={kpiData.todayOrders}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          }
        />
        <KpiCard
          label="Ingresos del día"
          value={new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(kpiData.todayRevenue / 100)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
              <path d="M4 9h8.5a2.5 2.5 0 0 1 0 5H4" />
              <path d="M8 9v9" />
              <path d="M20 15h-6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M16 15V6" />
            </svg>
          }
        />
        <KpiCard
          label="En proceso"
          value={kpiData.inProcess}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
          }
        />
        <KpiCard
          label="Pendientes"
          value={kpiData.pending}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <Select
              label="Estado"
              options={STATUS_FILTERS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            />
            <Select
              label="Pago"
              options={PAYMENT_METHODS}
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            />
            <Select
              label="Fecha"
              options={DATE_RANGE_FILTERS}
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as DateRangeFilter)}
            />
          </div>
          <div className="w-full lg:w-80">
            <Input
              placeholder="Buscar por ID o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {!orders || orders.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1a1 1 0 0 0-1 1v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">No hay órdenes registradas</h3>
          <p className="mt-1 text-sm text-neutral-500">Comienza creando tu primera orden para verla aquí.</p>
          <Link to="/admin/orders/new" className="mt-4 inline-block">
            <Button variant="solid">Crear tu primera orden</Button>
          </Link>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">Sin resultados</h3>
          <p className="mt-1 text-sm text-neutral-500">No se encontraron órdenes con los filtros actuales.</p>
          <Button variant="outline" className="mt-4" onClick={handleClearFilters}>
            Limpiar todos los filtros
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Pago
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className={selectedOrderIds.has(order.id) ? 'bg-primary-50/50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.has(order.id)}
                        onChange={(e) => handleSelectOne(order.id, e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      #{order.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {order.userId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {order.createdAt.toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Price amount={order.pricing.total.amount} currency={order.pricing.total.currency} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {order.paymentMethod === 'card' ? 'Tarjeta' : order.paymentMethod === 'paypal' ? 'PayPal' : 'Contra reembolso'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={statusSelectValues[order.id] ?? ''}
                          onChange={(e) => {
                            setStatusSelectValues((prev) => ({ ...prev, [order.id]: e.target.value }));
                            handleStatusChange(order.id, e.target.value as OrderStatus);
                          }}
                          disabled={updatingOrderId === order.id || getAvailableStatusTransitions(order.status).length === 0}
                          className="text-sm"
                        >
                          <option value="" disabled>
                            Cambiar estado
                          </option>
                          {getAvailableStatusTransitions(order.status).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <OrderActionsDropdown order={order} onViewDetail={() => {}} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedOrderIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedOrderIds.size}
          onClear={() => setSelectedOrderIds(new Set())}
          onBulkComplete={handleBulkComplete}
          onBulkDelete={handleBulkDelete}
          isBulkProcessing={isBulkProcessing}
        />
      )}
    </div>
  );
}

export default AdminOrdersPage;
