import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
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
import { ROUTES } from '@/constants/routes';
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

function OrderActionsDropdown({ order, onDeleteOrder }: { order: Order; onDeleteOrder: (orderId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const menuWidth = 192;
      const estimatedMenuHeight = 152;
      const padding = 8;
      const spaceBelow = window.innerHeight - rect.bottom - padding;
      const spaceAbove = rect.top - padding;
      const openAbove = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
      const top = openAbove
        ? Math.max(padding, rect.top - Math.min(estimatedMenuHeight, spaceAbove) - 4)
        : Math.max(
            padding,
            Math.min(rect.bottom + 4, window.innerHeight - Math.min(estimatedMenuHeight, window.innerHeight - 16) - padding),
          );
      const left = Math.max(padding, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - padding));
      setPosition({ top, left });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const menu = open && position ? createPortal(
    <>
      <button
        type="button"
        aria-label="Cerrar menú de acciones"
        className="fixed inset-0 z-[90] cursor-default"
        onClick={() => setOpen(false)}
      />
      <div
        role="menu"
        data-testid="order-actions-menu"
        style={{ top: position.top, left: position.left }}
        className="fixed z-[100] max-h-[calc(100vh-1rem)] w-48 overflow-y-auto rounded-md bg-white py-1 shadow-xl ring-1 ring-black/10"
      >
        <Link
          to={`/admin/orders/${order.id}`}
          onClick={() => setOpen(false)}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Ver detalle
        </Link>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
          onClick={() => setOpen(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Editar orden
        </button>
        <div className="my-1 h-px bg-neutral-100" />
        <button
          type="button"
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
          onClick={() => { setOpen(false); onDeleteOrder(order.id); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          Eliminar orden
        </button>
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Acciones de la orden ${order.id.slice(-8)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="order-actions-trigger"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-cyan-400/25 bg-transparent text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>
      {menu}
    </>
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
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<ServiceError | null>(null);
  const [idFilter, setIdFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [exactDateFilter, setExactDateFilter] = useState('');
  const [minimumTotalFilter, setMinimumTotalFilter] = useState('');
  const [maximumTotalFilter, setMaximumTotalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusSelectValues, setStatusSelectValues] = useState<Record<string, string>>({});
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 20;

  const fetchOrders = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const filters: { status?: OrderStatus } = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
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
      const updated = await ordersService.updateOrderStatus(orderId, newStatus);
      if (updated) {
        setOrders((prev) =>
          prev ? prev.map((o) => (o.id === orderId ? updated : o)) : prev,
        );
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
      setStatusSelectValues((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      setUpdatingOrderId(null);
    }
  };

  const handleStartPayment = (order: Order) => {
    if (order.status !== 'pending' && order.status !== 'processing') return;
    navigate(`${ROUTES.CHECKOUT}?orderId=${encodeURIComponent(order.id)}&returnTo=admin`);
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
    if (selectedOrderIds.size === 0 || !user || !orders) return;
    setIsBulkProcessing(true);
    setError(null);
    const selected = orders.filter((order) => selectedOrderIds.has(order.id));
    const completedIds = new Set<string>();
    const failedIds: string[] = [];

    // Respect pending -> processing -> completed; continue after individual failures.
    for (const order of selected) {
      try {
        let currentStatus = order.status;
        if (currentStatus === 'pending') {
          const processing = await ordersService.updateOrderStatus(order.id, 'processing');
          if (!processing) throw new Error('No se pudo pasar la orden a procesamiento');
          currentStatus = processing.status;
        }
        if (currentStatus !== 'processing') {
          failedIds.push(order.id);
          continue;
        }
        const completed = await ordersService.updateOrderStatus(order.id, 'completed');
        if (!completed) throw new Error('No se pudo completar la orden');
        completedIds.add(order.id);
      } catch {
        failedIds.push(order.id);
      }
    }

    setSelectedOrderIds(new Set(failedIds));
    await fetchOrders();
    if (failedIds.length > 0) {
      setError({
        code: 'VALIDATION_ERROR',
        message: `${completedIds.size} orden(es) completada(s). ${failedIds.length} no se pudieron completar por su estado actual o por un error de persistencia.`,
        details: { failedOrderIds: failedIds },
      });
    }
    setIsBulkProcessing(false);
  };

  const handleDeleteOrders = async (orderIds: string[]) => {
    const uniqueOrderIds = [...new Set(orderIds)];
    if (uniqueOrderIds.length === 0) return;
    if (!user) {
      setError({
        code: 'UNAUTHORIZED',
        message: 'Necesitas una sesión de administrador para eliminar órdenes.',
        details: {},
      });
      return;
    }

    const confirmation = uniqueOrderIds.length === 1
      ? '¿Eliminar permanentemente esta orden? Esta acción no se puede deshacer.'
      : `¿Eliminar permanentemente estas ${uniqueOrderIds.length} órdenes? Esta acción no se puede deshacer.`;
    if (!window.confirm(confirmation)) return;

    setIsBulkProcessing(true);
    setError(null);
    try {
      const deletedOrderIds = await ordersService.deleteOrders(uniqueOrderIds);
      const deletedIds = new Set(deletedOrderIds);
      setOrders((prev) => prev ? prev.filter((order) => !deletedIds.has(order.id)) : prev);
      setSelectedOrderIds((prev) => new Set([...prev].filter((id) => !deletedIds.has(id))));
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

  const handleBulkDelete = async () => {
    await handleDeleteOrders([...selectedOrderIds]);
  };

  const handleClearFilters = () => {
    setIdFilter('');
    setUserFilter('');
    setExactDateFilter('');
    setMinimumTotalFilter('');
    setMaximumTotalFilter('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setDateRangeFilter('all');
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [idFilter, userFilter, exactDateFilter, minimumTotalFilter, maximumTotalFilter, statusFilter, paymentFilter, dateRangeFilter]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    const normalizedId = idFilter.trim().toLowerCase();
    const normalizedUser = userFilter.trim().toLowerCase();
    const minimumTotal = minimumTotalFilter.trim() === '' ? null : Number(minimumTotalFilter);
    const maximumTotal = maximumTotalFilter.trim() === '' ? null : Number(maximumTotalFilter);

    return orders.filter((order) => {
      const shortId = order.id.slice(-8).toLowerCase();
      const normalizedOrderId = order.id.toLowerCase();
      const matchesId = !normalizedId || normalizedOrderId.includes(normalizedId) || shortId.includes(normalizedId);
      const matchesUser = !normalizedUser || order.userId.toLowerCase().includes(normalizedUser);
      const orderDate = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}-${String(order.createdAt.getDate()).padStart(2, '0')}`;
      const matchesExactDate = !exactDateFilter || orderDate === exactDateFilter;
      const total = order.pricing.total.amount / 100;
      const matchesMinimumTotal = minimumTotal === null || total >= minimumTotal;
      const matchesMaximumTotal = maximumTotal === null || total <= maximumTotal;
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.paymentMethod === paymentFilter;
      const matchesDateRange = isInDateRange(order.createdAt, dateRangeFilter);

      return matchesId
        && matchesUser
        && matchesExactDate
        && matchesMinimumTotal
        && matchesMaximumTotal
        && matchesStatus
        && matchesPayment
        && matchesDateRange;
    });
  }, [orders, idFilter, userFilter, exactDateFilter, minimumTotalFilter, maximumTotalFilter, statusFilter, paymentFilter, dateRangeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE,
  );

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

      {error && status !== 'error' && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </p>
      )}

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
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">Filtros por columna</h2>
            <p className="mt-1 text-xs text-neutral-500">Combina varios criterios para acotar los resultados.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            Limpiar filtros
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <Input
            label="ID"
            placeholder="ID completo o últimos 8"
            value={idFilter}
            onChange={(event) => setIdFilter(event.target.value)}
            aria-label="Filtrar por ID"
          />
          <Input
            label="Usuario"
            placeholder="UID del usuario"
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
            aria-label="Filtrar por usuario"
          />
          <Input
            label="Fecha"
            type="date"
            value={exactDateFilter}
            onChange={(event) => setExactDateFilter(event.target.value)}
            aria-label="Filtrar por fecha"
          />
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Total</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Mínimo"
                value={minimumTotalFilter}
                onChange={(event) => setMinimumTotalFilter(event.target.value)}
                aria-label="Total mínimo"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Máximo"
                value={maximumTotalFilter}
                onChange={(event) => setMaximumTotalFilter(event.target.value)}
                aria-label="Total máximo"
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">Importe en unidades de moneda.</p>
          </div>
          <Select
            label="Estado"
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          />
          <Select
            label="Pago"
            options={PAYMENT_METHODS}
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
          />
          <Select
            label="Rango de fechas"
            options={DATE_RANGE_FILTERS}
            value={dateRangeFilter}
            onChange={(event) => setDateRangeFilter(event.target.value as DateRangeFilter)}
          />
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
                {visibleOrders.map((order) => (
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
                        <OrderActionsDropdown order={order} onDeleteOrder={(orderId) => { void handleDeleteOrders([orderId]); }} />
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid="order-payment-button"
                          aria-label={`Registrar pago de la orden ${order.id.slice(-8)}`}
                          disabled={(order.status !== 'pending' && order.status !== 'processing') || updatingOrderId === order.id}
                          onClick={() => handleStartPayment(order)}
                        >
                          Registrar pago
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-600" aria-live="polite">
              Mostrando {filteredOrders.length === 0 ? 0 : (currentPage - 1) * ORDERS_PER_PAGE + 1}–{Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)} de {filteredOrders.length} órdenes filtradas ({orders?.length ?? 0} cargadas)
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Anterior</Button>
              <span className="text-sm text-neutral-600">Página {Math.min(currentPage, totalPages)} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Siguiente</Button>
            </div>
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
