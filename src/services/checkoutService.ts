/**
 * CheckoutService — capa de servicios para checkout.
 *
 * Simula el procesamiento de pago y creación de orden.
 * La lógica de negocio real (Pagos, Firestore) se implementará en fases posteriores.
 *
 * NUNCA debe importar Firebase directamente desde componentes.
 */
import { firebaseTryCatch } from '@/infrastructure/firebase/config';
import { calculateTotal } from '@/utils/cart/cartUtils';
import type { Order, CheckoutData } from '@/types/order';
import type { CartState } from '@/types/cart';
import type { AsyncStatus } from '@/types/ui';

const SIMULATED_PAYMENT_DELAY_MS = 1200;

export interface CheckoutResult {
  readonly status: AsyncStatus;
  readonly order: Order | null;
  readonly error: string | null;
}

export const checkoutService = {
  async processCheckout(data: CheckoutData, cartState: CartState, userId: string): Promise<Order> {
    return firebaseTryCatch(async () => {
      if (cartState.items.length === 0) {
        throw new Error('El carrito está vacío');
      }

      await new Promise((resolve) => setTimeout(resolve, SIMULATED_PAYMENT_DELAY_MS));

      const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const totals = calculateTotal(cartState.items, cartState.discount);

      const order: Order = {
        id: orderId,
        userId,
        items: cartState.items.map((item) => ({
          orderId,
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        pricing: {
          subtotal: totals.subtotal,
          tax: totals.tax,
          shipping: totals.shipping,
          discount: totals.discount,
          total: totals.total,
        },
        status: 'pending',
        statusHistory: [
          {
            from: 'pending',
            to: 'pending',
            by: userId,
            timestamp: new Date(),
          },
        ],
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return order;
    });
  },
};
