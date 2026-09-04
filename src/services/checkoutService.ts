/**
 * Checkout service: prepara los datos del cliente y delega la creación segura
 * de la orden en la función server-side /api/checkout.
 *
 * Los precios y el stock NO se confían al navegador: el servidor vuelve a leer
 * los productos y ejecuta la creación + descuento de stock en una transacción.
 */
import { firebaseTryCatch } from '@/infrastructure/firebase/config';
import { ordersService } from './ordersService';
import type { Order, CheckoutData } from '@/types/order';
import type { CartState } from '@/types/cart';
import type { AsyncStatus } from '@/types/ui';
import { getCurrentUserIdToken } from '@/infrastructure/firebase/auth';

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

      const idToken = await getCurrentUserIdToken();
      if (!idToken) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');

      await new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_PAYMENT_DELAY_MS));

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          items: cartState.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        }),
      });

      const payload = (await response.json()) as { success?: boolean; orderId?: string; error?: string };
      if (!response.ok || !payload.success || !payload.orderId) {
        throw new Error(payload.error ?? 'No pudimos completar el pedido. Intenta nuevamente.');
      }

      const order = await ordersService.fetchOrder(payload.orderId);
      if (!order) throw new Error('El pedido se creó pero no pudo recuperarse.');
      return order;
    });
  },
};
