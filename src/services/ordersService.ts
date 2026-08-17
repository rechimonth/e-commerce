import type { Order, OrderDTO, OrderStatus } from '@/types/order';
import { firebaseTryCatch } from '@/infrastructure/firebase/config';
import { FirebaseInfraError } from '@/infrastructure/firebase/config';
import {
  createOrder as firestoreCreateOrder,
  getUserOrders as firestoreGetUserOrders,
  getAllOrders as firestoreGetAllOrders,
  updateOrderStatus as firestoreUpdateOrderStatus,
  getOrder as firestoreGetOrder,
} from '@/infrastructure/firebase/firestore';

function toOrder(dto: OrderDTO): Order {
  const currency = dto.currency;
  const createdAt = dto.createdAt ?? dto.statusHistory[0]?.timestamp ?? 0;
  const updatedAt = dto.updatedAt ?? dto.statusHistory[dto.statusHistory.length - 1]?.timestamp ?? createdAt;

  return {
    id: dto.id,
    userId: dto.userId,
    items: dto.items.map((item) => ({
      orderId: item.orderId,
      productId: item.productId,
      name: item.name,
      price: { amount: item.priceCents, currency },
      quantity: item.quantity,
      image: { url: item.imageUrl, alt: item.name, key: dto.id },
    })),
    pricing: {
      subtotal: { amount: dto.subtotalCents, currency },
      tax: { amount: dto.taxCents, currency },
      shipping: { amount: dto.shippingCents, currency },
      discount: { amount: dto.discountCents, currency },
      total: { amount: dto.totalCents, currency },
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
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
  };
}

export const ordersService = {
  async createOrder(input: Omit<OrderDTO, 'id' | 'status' | 'statusHistory'>): Promise<Order> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreCreateOrder(input);
      return toOrder(dto);
    });
  },

  async fetchUserOrders(userId: string): Promise<Order[]> {
    return firebaseTryCatch(async () => {
      const dtos = await firestoreGetUserOrders(userId);
      return dtos.map(toOrder);
    });
  },

  async fetchOrder(id: string): Promise<Order | null> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreGetOrder(id);
      if (!dto) return null;
      return toOrder(dto);
    });
  },

  async cancelOrder(_orderId: string, _userId: string): Promise<Order> {
    return firebaseTryCatch(async () => {
      throw new FirebaseInfraError(
        'INTERNAL_ERROR',
        'La cancelacion de ordenes no esta implementada en esta fase',
      );
    });
  },

  async fetchAllOrders(filters?: { status?: OrderStatus; limit?: number }): Promise<Order[]> {
    return firebaseTryCatch(async () => {
      const dtos = await firestoreGetAllOrders(filters);
      return dtos.map(toOrder);
    });
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    adminUserId: string,
  ): Promise<Order | null> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreUpdateOrderStatus(orderId, status, adminUserId);
      if (!dto) return null;
      return toOrder(dto);
    });
  },
};
