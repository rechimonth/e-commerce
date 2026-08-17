/**
 * Checkout service: simula el pago y persiste la orden en Firestore.
 * Los componentes no conocen Firebase; esta capa orquesta la lógica de negocio.
 */
import { firebaseTryCatch } from '@/infrastructure/firebase/config';
import { createOrder } from '@/infrastructure/firebase/firestore';
import { calculateTotal } from '@/utils/cart/cartUtils';
import type { Order, CheckoutData } from '@/types/order';
import type { CartState } from '@/types/cart';
import type { AsyncStatus } from '@/types/ui';

const SIMULATED_PAYMENT_DELAY_MS = 400;

export interface CheckoutResult {
  readonly status: AsyncStatus;
  readonly order: Order | null;
  readonly error: string | null;
}

export const checkoutService = {
  async processCheckout(data: CheckoutData, cartState: CartState, userId: string): Promise<Order> {
    return firebaseTryCatch(async () => {
      if (!userId) throw new Error('Usuario no autenticado');
      if (cartState.items.length === 0) throw new Error('El carrito está vacío');

      // El pago es deliberadamente simulado porque la consigna no requiere una pasarela real.
      await new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_PAYMENT_DELAY_MS));

      const totals = calculateTotal(cartState.items, cartState.discount);
      const currency = totals.total.currency;

      const dto = await createOrder({
        userId,
        items: cartState.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          priceCents: item.price.amount,
          quantity: item.quantity,
          imageUrl: item.image.url,
          orderId: '',
        })),
        subtotalCents: totals.subtotal.amount,
        taxCents: totals.tax.amount,
        shippingCents: totals.shipping.amount,
        discountCents: totals.discount.amount,
        totalCents: totals.total.amount,
        currency,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // createOrder devuelve el ID real de Firestore. Normalizamos orderId de cada item.
      return {
        id: dto.id,
        userId: dto.userId,
        items: dto.items.map((item) => ({
          orderId: dto.id,
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
          ...entry,
          timestamp: new Date(entry.timestamp),
        })),
        shippingAddress: dto.shippingAddress,
        billingAddress: dto.billingAddress,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
        createdAt: new Date(dto.createdAt ?? Date.now()),
        updatedAt: new Date(dto.updatedAt ?? Date.now()),
      };
    });
  },
};
