/**
 * OrdersService — capa de servicios para órdenes.
 *
 * En producción, consulta Firestore para órdenes del usuario.
 * Envoltura todas las llamadas en firebaseTryCatch para consistencia de errores.
 */
import type { Order, OrderDTO, OrderStatus } from '@/types/order';
import { canTransition } from '@/types/order';
import { firebaseTryCatch } from '@/infrastructure/firebase/config';
import { FirebaseInfraError } from '@/infrastructure/firebase/config';
import {
  getAllOrders as firestoreGetAllOrders,
  getUserOrders as firestoreGetUserOrders,
  updateOrderStatus as firestoreUpdateOrderStatus,
  getOrder as firestoreGetOrder,
  createOrder as firestoreCreateOrder,
  updateOrderTracking as firestoreUpdateOrderTracking,
  addOrderAttachment as firestoreAddOrderAttachment,
  removeOrderAttachment as firestoreRemoveOrderAttachment,
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
    trackingNumber: dto.trackingNumber,
    carrier: dto.carrier,
    estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : undefined,
    attachments: dto.attachments?.map((att) => ({
      key: att.key,
      url: att.url,
      name: att.name,
      uploadedAt: new Date(att.uploadedAt),
    })),
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
  };
}

export const ordersService = {
  async fetchUserOrders(userId: string): Promise<Order[]> {
    return firebaseTryCatch(async () => {
      if (!userId) throw new FirebaseInfraError('UNAUTHORIZED', 'Usuario no autenticado');
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

  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreGetOrder(orderId);
      if (!dto) throw new FirebaseInfraError('NOT_FOUND', 'Orden no encontrada');
      if (dto.userId !== userId) throw new FirebaseInfraError('FORBIDDEN', 'No tienes permiso para cancelar esta orden');
      if (!canTransition(dto.status, 'cancelled')) {
        throw new FirebaseInfraError('VALIDATION_ERROR', 'Esta orden no se puede cancelar en su estado actual');
      }
      const updated = await firestoreUpdateOrderStatus(orderId, 'cancelled', userId);
      if (!updated) throw new FirebaseInfraError('INTERNAL_ERROR', 'No se pudo cancelar la orden');
      return toOrder(updated);
    });
  },

  async createOrder(input: Omit<OrderDTO, 'id' | 'status' | 'statusHistory'>): Promise<Order> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreCreateOrder(input);
      return toOrder(dto);
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

  async updateTracking(
    orderId: string,
    trackingNumber: string,
    carrier: string,
    estimatedDelivery: Date,
  ): Promise<Order | null> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreUpdateOrderTracking(
        orderId,
        trackingNumber,
        carrier,
        estimatedDelivery.getTime(),
      );
      if (!dto) return null;
      return toOrder(dto);
    });
  },

  async addAttachment(
    orderId: string,
    attachment: { key: string; url: string; name: string; uploadedAt: Date },
  ): Promise<Order | null> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreAddOrderAttachment(orderId, {
        ...attachment,
        uploadedAt: attachment.uploadedAt.getTime(),
      });
      if (!dto) return null;
      return toOrder(dto);
    });
  },

  async removeAttachment(orderId: string, key: string): Promise<Order | null> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreRemoveOrderAttachment(orderId, key);
      if (!dto) return null;
      return toOrder(dto);
    });
  },
};