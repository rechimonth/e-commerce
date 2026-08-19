/**
 * Tipos de órdenes y checkout.
 *
 * OrderStatus es un union literal con 4 valores fijos.
 * OrderStatusTransition documenta los cambios legales de estado.
 * La validación de transiciones ocurre en orderService (cliente) y
 * Firestore Security Rules (servidor).
 */
import type { Money, CurrencyCode } from './pricing';
import type { CartItem } from './cart';

export const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['card', 'paypal', 'cash'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface OrderStatusTransition {
  readonly from: OrderStatus;
  readonly to: OrderStatus;
  readonly by: string;
  readonly reason?: string;
  readonly timestamp: Date;
}

export const VALID_ORDER_TRANSITIONS: Readonly<Record<OrderStatus, ReadonlyArray<OrderStatus>>> = {
  pending: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
} as const;

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (VALID_ORDER_TRANSITIONS[from] as readonly OrderStatus[]).includes(to);
}

export interface Address {
  readonly street: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly country: string;
}

export interface OrderItem extends Omit<CartItem, 'maxStock'> {
  readonly orderId: string;
}

export interface OrderPricing {
  readonly subtotal: Money;
  readonly tax: Money;
  readonly shipping: Money;
  readonly discount: Money;
  readonly total: Money;
}

export interface Order {
  readonly id: string;
  readonly userId: string;
  readonly items: OrderItem[];
  readonly pricing: OrderPricing;
  readonly status: OrderStatus;
  readonly statusHistory: OrderStatusTransition[];
  readonly shippingAddress: Address;
  readonly billingAddress: Address;
  readonly paymentMethod: PaymentMethod;
  readonly notes?: string;
  readonly trackingNumber?: string;
  readonly carrier?: string;
  readonly estimatedDelivery?: Date;
  readonly attachments?: ReadonlyArray<{
    readonly key: string;
    readonly url: string;
    readonly name: string;
    readonly uploadedAt: Date;
  }>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OrderDTO {
  readonly id: string;
  readonly userId: string;
  readonly items: ReadonlyArray<{
    productId: string;
    name: string;
    priceCents: number;
    quantity: number;
    imageUrl: string;
    orderId: string;
  }>;
  readonly subtotalCents: number;
  readonly taxCents: number;
  readonly shippingCents: number;
  readonly discountCents: number;
  readonly totalCents: number;
  readonly currency: CurrencyCode;
  readonly status: OrderStatus;
  readonly statusHistory: ReadonlyArray<{
    from: OrderStatus;
    to: OrderStatus;
    by: string;
    reason?: string;
    timestamp: number;
  }>;
  readonly shippingAddress: Address;
  readonly billingAddress: Address;
  readonly paymentMethod: PaymentMethod;
  readonly notes?: string;
  readonly trackingNumber?: string;
  readonly carrier?: string;
  readonly estimatedDelivery?: number;
  readonly attachments?: ReadonlyArray<{
    readonly key: string;
    readonly url: string;
    readonly name: string;
    readonly uploadedAt: number;
  }>;
  readonly createdAt?: number;
  readonly updatedAt?: number;
}

export interface CheckoutData {
  readonly shippingAddress: Address;
  readonly billingAddress: Address;
  readonly paymentMethod: PaymentMethod;
  readonly notes?: string;
}

export type OrderStatusFilter = 'all' | OrderStatus;
