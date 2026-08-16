import { ordersService } from '@/services/ordersService';
import { calculateTotal } from '@/utils/cart/cartUtils';
import type { Order, CheckoutData } from '@/types/order';
import type { CartState } from '@/types/cart';
import type { AsyncStatus } from '@/types/ui';

export interface CheckoutResult {
  readonly status: AsyncStatus;
  readonly order: Order | null;
  readonly error: string | null;
}

export const checkoutService = {
  async processCheckout(data: CheckoutData, cartState: CartState, userId: string): Promise<Order> {
    if (cartState.items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    const totals = calculateTotal(cartState.items, cartState.discount);

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
      currency: totals.subtotal.currency,
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingAddress,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
    });

    return order;
  },
};