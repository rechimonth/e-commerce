/**
 * Checkout service: simula el pago y persiste la orden en Firestore.
 * Los componentes no conocen Firebase; esta capa orquesta la lógica de negocio.
 */
import { firebaseTryCatch } from '@/infrastructure/firebase/config';
import { calculateTotal } from '@/utils/cart/cartUtils';
import { ordersService } from './ordersService';
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

      const order = await ordersService.createOrder({
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

      return order;
    });
  },
};
