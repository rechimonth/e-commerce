/**
 * DashboardService — obtiene estadísticas agregadas para el panel de administración.
 *
 * NO debe usarse desde componentes. Usar desde páginas admin o hooks personalizados.
 */
import { firebaseTryCatch } from '@/infrastructure/firebase/config';
import {
  getProducts as firestoreGetProducts,
  getAllOrders as firestoreGetAllOrders,
} from '@/infrastructure/firebase/firestore';
import type { DashboardStats } from '@/types/admin';
import type { OrderStatus } from '@/types/order';

const CURRENCY = 'USD' as const;

export interface DashboardStatsResult {
  readonly stats: DashboardStats;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    return firebaseTryCatch(async () => {
      const [products, orders] = await Promise.all([
        firestoreGetProducts(),
        firestoreGetAllOrders(),
      ]);

      let pendingCount = 0;
      let processingCount = 0;
      let completedCount = 0;
      let cancelledCount = 0;
      let totalRevenueCents = 0;

      const recentOrders = orders
        .slice()
        .sort((a, b) => {
          const aMs = typeof a.createdAt === 'number' ? a.createdAt : 0;
          const bMs = typeof b.createdAt === 'number' ? b.createdAt : 0;
          return bMs - aMs;
        })
        .slice(0, 5)
        .map((order) => ({
          id: order.id,
          userId: order.userId,
          total: { amount: order.totalCents, currency: order.currency },
          status: order.status as OrderStatus,
          createdAt: new Date(
            typeof order.createdAt === 'number' ? order.createdAt : Date.now(),
          ),
        }));

      for (const order of orders) {
        const status = order.status as OrderStatus;
        if (status === 'pending') pendingCount += 1;
        else if (status === 'processing') processingCount += 1;
        else if (status === 'completed') completedCount += 1;
        else if (status === 'cancelled') cancelledCount += 1;
        totalRevenueCents += order.totalCents;
      }

      return {
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders: pendingCount,
        completedOrders: completedCount,
        totalRevenue: { amount: totalRevenueCents, currency: CURRENCY },
        orderStatusCounts: {
          pending: pendingCount,
          processing: processingCount,
          completed: completedCount,
          cancelled: cancelledCount,
        },
        recentOrders,
      };
    });
  },
};
