/**
 * Checkout service: envía el checkout a la función server-side.
 * El navegador nunca decide el precio final ni modifica stock directamente.
 */
import { getCurrentUserIdToken } from '@/infrastructure/firebase/auth';
import { firebaseTryCatch } from '@/infrastructure/firebase/config';
import type { Order, OrderDTO, CheckoutData } from '@/types/order';
import type { CartState } from '@/types/cart';
import type { AsyncStatus } from '@/types/ui';

const SIMULATED_PAYMENT_DELAY_MS = 400;

export interface CheckoutResult {
  readonly status: AsyncStatus;
  readonly order: Order | null;
  readonly error: string | null;
}

function dtoToOrder(dto: OrderDTO): Order {
  const createdAt = dto.createdAt ?? dto.statusHistory[0]?.timestamp ?? 0;
  const updatedAt = dto.updatedAt ?? dto.statusHistory[dto.statusHistory.length - 1]?.timestamp ?? createdAt;
  return {
    id: dto.id,
    userId: dto.userId,
    items: dto.items.map((item) => ({
      orderId: item.orderId,
      productId: item.productId,
      name: item.name,
      price: { amount: item.priceCents, currency: dto.currency },
      quantity: item.quantity,
      image: { url: item.imageUrl, alt: item.name, key: dto.id },
    })),
    pricing: {
      subtotal: { amount: dto.subtotalCents, currency: dto.currency },
      tax: { amount: dto.taxCents, currency: dto.currency },
      shipping: { amount: dto.shippingCents, currency: dto.currency },
      discount: { amount: dto.discountCents, currency: dto.currency },
      total: { amount: dto.totalCents, currency: dto.currency },
    },
    status: dto.status,
    statusHistory: dto.statusHistory.map((entry) => ({
      from: entry.from,
      to: entry.to,
      by: entry.by,
      reason: entry.reason,
      timestamp: new Date(entry.timestamp),
    })),
    shippingAddress: dto.shippingAddress,
    billingAddress: dto.billingAddress,
    paymentMethod: dto.paymentMethod,
    notes: dto.notes,
    trackingNumber: dto.trackingNumber,
    carrier: dto.carrier,
    estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : undefined,
    attachments: dto.attachments?.map((attachment) => ({
      key: attachment.key,
      url: attachment.url,
      name: attachment.name,
      uploadedAt: new Date(attachment.uploadedAt),
    })),
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
  };
}

function getApiError(response: Response, fallback: string): Promise<Error> {
  return response
    .json()
    .then((body: unknown) => {
      if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
        return new Error(body.error);
      }
      return new Error(fallback);
    })
    .catch(() => new Error(fallback));
}

export const checkoutService = {
  async processCheckout(data: CheckoutData, cartState: CartState, userId: string): Promise<Order> {
    return firebaseTryCatch(async () => {
      if (!userId) throw new Error('Usuario no autenticado');
      if (cartState.items.length === 0) throw new Error('El carrito está vacío');

      await new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_PAYMENT_DELAY_MS));
      const token = await getCurrentUserIdToken();

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartState.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        }),
      });

      if (!response.ok) {
        throw await getApiError(response, 'No se pudo completar el checkout');
      }

      const body = (await response.json()) as { success?: boolean; data?: OrderDTO; error?: string };
      if (!body.success || !body.data) throw new Error(body.error ?? 'Respuesta de checkout inválida');

      return dtoToOrder(body.data);
    });
  },
};
