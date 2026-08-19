import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { Price } from '@/components/ui/Price';
import { ordersService } from '@/services/ordersService';
import { VALID_ORDER_TRANSITIONS, type OrderStatus, type Order } from '@/types/order';
import type { ServiceError } from '@/types/api';
import type { AsyncStatus } from '@/types/ui';
import { resolveProductImage, handleProductImageError } from '@/utils/productImage';

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<ServiceError | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [statusSelectValue, setStatusSelectValue] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setStatus('loading');
    setError(null);
    try {
      const result = await ordersService.fetchOrder(id);
      if (result) {
        setOrder(result);
        setStatus('success');
        setTrackingNumber(result.trackingNumber ?? '');
        setCarrier(result.carrier ?? '');
        setEstimatedDelivery(result.estimatedDelivery ? result.estimatedDelivery.toISOString().slice(0, 10) : '');
      } else {
        setError({ code: 'NOT_FOUND', message: 'Orden no encontrada' });
        setStatus('error');
      }
    } catch (e) {
      const err: ServiceError = {
        code: 'INTERNAL_ERROR',
        message: e instanceof Error ? e.message : 'Error al cargar orden',
        details: { error: e instanceof Error ? e.message : String(e) },
      };
      setError(err);
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      if (!user) throw new Error('Usuario administrador no autenticado');
      const updated = await ordersService.updateOrderStatus(order.id, newStatus, user.uid);
      if (updated) {
        setOrder(updated);
        setStatusSelectValue("");
      }
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : 'Error al actualizar estado');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveTracking = async () => {
    if (!order || !trackingNumber.trim() || !carrier.trim() || !estimatedDelivery) return;
    setIsSavingTracking(true);
    setTrackingError(null);
    try {
      const updated = await ordersService.updateTracking(
        order.id,
        trackingNumber.trim(),
        carrier.trim(),
        new Date(estimatedDelivery),
      );
      if (updated) setOrder(updated);
    } catch (e) {
      setTrackingError(e instanceof Error ? e.message : 'Error al guardar seguimiento');
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const { getCurrentUserIdToken } = await import('@/infrastructure/firebase/auth');
      const idToken = await getCurrentUserIdToken();
      const formData = new FormData();
      formData.append('fileName', file.name);
      formData.append('fileType', file.type);
      formData.append('fileSize', String(file.size));
      formData.append('prefix', 'orders');
      formData.append('orderId', order.id);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al subir archivo');
      const attachment = {
        key: data.data.key,
        url: data.data.publicUrl,
        name: file.name,
        uploadedAt: new Date(),
      };
      const updated = await ordersService.addAttachment(order.id, attachment);
      if (updated) setOrder(updated);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Error al subir archivo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = async (key: string) => {
    if (!order) return;
    const updated = await ordersService.removeAttachment(order.id, key);
    if (updated) setOrder(updated);
  };

  const getAvailableTransitions = (current: OrderStatus): OrderStatus[] => {
    return VALID_ORDER_TRANSITIONS[current] as OrderStatus[];
  };

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === 'error' && error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-neutral-600">{error.message}</p>
        <Link to="/admin/orders">
          <Button variant="outline" className="mt-4">
            Volver a órdenes
          </Button>
        </Link>
      </Card>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">
          Orden #{order.id.slice(-8)}
        </h1>
        <Link to="/admin/orders">
          <Button variant="outline" size="sm">
            Volver a órdenes
          </Button>
        </Link>
      </div>

      {updateError && <Alert variant="error" title="Error" message={updateError} />}

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <OrderStatusBadge status={order.status} />
            <p className="mt-2 text-sm text-neutral-500">
              Creada: {order.createdAt.toLocaleString('es-ES')}
            </p>
            <p className="text-sm text-neutral-500">
              Actualizada: {order.updatedAt.toLocaleString('es-ES')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusSelectValue}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              disabled={isUpdating || getAvailableTransitions(order.status).length === 0}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="" disabled>
                Cambiar estado
              </option>
              {getAvailableTransitions(order.status).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {isUpdating && <span className="text-xs text-neutral-500">Actualizando...</span>}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Seguimiento de envío</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Número de seguimiento"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Ej. 1Z999AA10123456784"
          />
          <Input
            label="Paquetería"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="Ej. FedEx, DHL, UPS"
          />
          <Input
            label="Fecha estimada de entrega"
            type="date"
            value={estimatedDelivery}
            onChange={(e) => setEstimatedDelivery(e.target.value)}
          />
        </div>
        {trackingError && <p className="mt-2 text-sm text-error-600">{trackingError}</p>}
        <div className="mt-4">
          <Button
            variant="solid"
            size="sm"
            onClick={handleSaveTracking}
            disabled={isSavingTracking || !trackingNumber.trim() || !carrier.trim() || !estimatedDelivery}
          >
            {isSavingTracking ? 'Guardando...' : 'Guardar seguimiento'}
          </Button>
        </div>
        {(order.trackingNumber || order.carrier || order.estimatedDelivery) && (
          <div className="mt-4 rounded-md border border-neutral-200 p-4">
            <p className="text-sm font-medium text-neutral-900">Información actual</p>
            <p className="mt-1 text-sm text-neutral-600">Número: {order.trackingNumber}</p>
            <p className="text-sm text-neutral-600">Paquetería: {order.carrier}</p>
            <p className="text-sm text-neutral-600">Entrega estimada: {order.estimatedDelivery?.toLocaleDateString('es-ES')}</p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Archivos adjuntos</h2>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Subiendo...' : 'Subir archivo'}
            </Button>
          </div>
        </div>
        {uploadError && <p className="mt-2 text-sm text-error-600">{uploadError}</p>}
        {order.attachments && order.attachments.length > 0 ? (
          <div className="mt-4 space-y-2">
            {order.attachments.map((att) => (
              <div key={att.key} className="flex items-center justify-between rounded-md border border-neutral-200 p-3">
                <div className="flex items-center gap-3">
                  <img src={att.url} alt={att.name} className="h-10 w-10 rounded object-cover" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{att.name}</p>
                    <p className="text-xs text-neutral-500">{att.uploadedAt.toLocaleString('es-ES')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={att.url} target="_blank" rel="noreferrer">Abrir</a>
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleRemoveAttachment(att.key)}>
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">No hay archivos adjuntos</p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Productos</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-4">
              <img
                src={resolveProductImage(item)}
                alt={item.image.alt}
                className="h-12 w-12 rounded object-cover"
               onError={handleProductImageError} />
              <div className="flex-1">
                <p className="font-medium text-neutral-900">{item.name}</p>
                <p className="text-sm text-neutral-500">{item.quantity} x</p>
              </div>
              <Price
                amount={item.price.amount * item.quantity}
                currency={item.price.currency}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Información de envío</h2>
        <div className="space-y-2">
          <p className="text-sm text-neutral-600">{order.shippingAddress.street}</p>
          <p className="text-sm text-neutral-600">
            {order.shippingAddress.city}, {order.shippingAddress.state}
          </p>
          <p className="text-sm text-neutral-600">
            {order.shippingAddress.zipCode} - {order.shippingAddress.country}
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Pago</h2>
        <p className="text-sm text-neutral-600">Método: {order.paymentMethod}</p>
        {order.notes && <p className="mt-2 text-sm text-neutral-600">Notas: {order.notes}</p>}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Resumen financiero</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Subtotal</span>
            <Price amount={order.pricing.subtotal.amount} currency={order.pricing.subtotal.currency} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Impuestos</span>
            <Price amount={order.pricing.tax.amount} currency={order.pricing.tax.currency} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Envío</span>
            <Price amount={order.pricing.shipping.amount} currency={order.pricing.shipping.currency} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Descuento</span>
            <Price amount={order.pricing.discount.amount} currency={order.pricing.discount.currency} />
          </div>
          <div className="border-t border-neutral-200 pt-2">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <Price amount={order.pricing.total.amount} currency={order.pricing.total.currency} />
            </div>
          </div>
        </div>
      </Card>

      {order.statusHistory.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Historial de estados</h2>
          <div className="space-y-3">
            {order.statusHistory.map((entry, i) => (
              <div key={i} className="border-l-2 border-neutral-200 pl-3 pb-2">
                <p className="text-sm">
                  <span className="font-medium">{entry.from}</span> →{' '}
                  <span className="font-medium">{entry.to}</span>
                </p>
                <p className="text-xs text-neutral-500">
                  Por: {entry.by} • {entry.timestamp.toLocaleString('es-ES')}
                </p>
                 {entry.reason && <p className="text-xs text-neutral-500">Razón: {entry.reason}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default AdminOrderDetailPage;
