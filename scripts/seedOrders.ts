import { createOrderFromCart, updateOrderStatusAdmin } from '@/services/orders.service';
import type { OrderStatus } from '@/types/order';

interface SeedOrderItem {
  readonly productId: string;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
}

interface SeedOrder {
  readonly userId: string;
  readonly total: number;
  readonly items: readonly SeedOrderItem[];
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export async function seedOrders(): Promise<void> {
  const orders: readonly SeedOrder[] = [
    {
      userId: '6ycNR0gM58fBuTC2LInK3UTH4kB2',
      total: 22,
      items: [
        { productId: 'AKti6L9viMEJ5dRiiN5K', name: 'Elden Ring', price: 113.12, quantity: 2 },
      ],
    },
    {
      userId: '6ycNR0gM58fBuTC2LInK3UTH4kB2',
      total: 28,
      items: [
        { productId: 'tom6s01u9VTfQESVDFJp', name: 'Reebok Nano', price: 282.43, quantity: 1 },
      ],
    },
    {
      userId: '6ycNR0gM58fBuTC2LInK3UTH4kB2',
      total: 39,
      items: [
        { productId: 'AKti6L9viMEJ5dRiiN5K', name: 'Elden Ring', price: 113.12, quantity: 1 },
        { productId: 'tom6s01u9VTfQESVDFJp', name: 'Reebok Nano', price: 282.43, quantity: 1 },
      ],
    },
  ];

  const targetStatuses: readonly OrderStatus[] = ['pending', 'completed', 'cancelled'];

  for (let i = 0; i < orders.length; i++) {
    const orderData = orders[i];
    const totalCents = toCents(orderData.total);

    const items = orderData.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      priceCents: toCents(item.price),
      quantity: item.quantity,
      imageUrl: '',
      orderId: '',
    }));

    const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

    const input = {
      userId: orderData.userId,
      items,
      subtotalCents,
      taxCents: 0,
      shippingCents: 0,
      discountCents: 0,
      totalCents,
      currency: 'USD' as const,
      shippingAddress: {
        street: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Spain',
      },
      billingAddress: {
        street: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Spain',
      },
      paymentMethod: 'card' as const,
      notes: 'Seed order ' + (i + 1),
    };

    const orderId = await createOrderFromCart(input);
    console.warn('Orden ' + (i + 1) + ' creada con ID: ' + orderId);

    if (targetStatuses[i] !== 'pending') {
      await updateOrderStatusAdmin(orderId, targetStatuses[i]);
      console.warn('   -> Estado actualizado a: ' + targetStatuses[i]);
    }
  }

  console.warn('Seed de ordenes completado.');
  process.exit(0);
}

seedOrders().catch((error) => {
  console.error('Error al ejecutar seedOrders:', error);
  process.exit(1);
});
