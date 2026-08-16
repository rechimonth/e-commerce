import type { Money } from './pricing';
import type { OrderStatus } from './order';

export interface OrderStatusCounts {
  readonly pending: number;
  readonly processing: number;
  readonly completed: number;
  readonly cancelled: number;
}

export interface DashboardStats {
  readonly totalProducts: number;
  readonly totalOrders: number;
  readonly pendingOrders: number;
  readonly completedOrders: number;
  readonly totalRevenue: Money;
  readonly orderStatusCounts: OrderStatusCounts;
  readonly recentOrders: Array<{
    id: string;
    userId: string;
    total: Money;
    status: OrderStatus;
    createdAt: Date;
  }>;
}
