import { FirebaseConfigurationError, getFirebaseAdminApp } from '../server/firebaseAdmin.js';
import { FirebaseTokenError, verifyFirebaseIdToken } from '../server/firebaseToken.js';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const VALID_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  pending: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

class OrderStatusError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function jsonError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // POST/PATCH are the supported contract. PUT and DELETE remain accepted for
  // compatibility with clients deployed before the current service contract.
  const allowedMethods = 'POST, PATCH, PUT, DELETE, OPTIONS';
  res.setHeader('Allow', allowedMethods);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', allowedMethods);
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    return res.status(204).end();
  }
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method ?? '')) {
    return jsonError(res, 405, 'Method not allowed. Use POST, PATCH, PUT, or DELETE');
  }

  const authorization = req.headers.authorization ?? '';
  if (!authorization.startsWith('Bearer ')) return jsonError(res, 401, 'Authentication required');

  const body = req.body as { orderId?: unknown; orderIds?: unknown; status?: unknown } | undefined;
  const isDelete = req.method === 'DELETE';
  let orderIds: string[] = [];

  if (isDelete) {
    const rawIds = Array.isArray(body?.orderIds)
      ? body.orderIds
      : typeof body?.orderId === 'string'
        ? [body.orderId]
        : [];
    orderIds = rawIds.map((value) => typeof value === 'string' ? value.trim() : '');
    if (
      orderIds.length < 1 ||
      orderIds.length > 100 ||
      orderIds.some((id) => !id || id.length > 128 || id.includes('/')) ||
      new Set(orderIds).size !== orderIds.length
    ) {
      return jsonError(res, 400, 'DELETE requires orderId or 1–100 unique orderIds');
    }
  } else if (
    !body ||
    typeof body.orderId !== 'string' ||
    !body.orderId.trim() ||
    body.orderId.length > 128 ||
    typeof body.status !== 'string' ||
    !Object.hasOwn(VALID_TRANSITIONS, body.status)
  ) {
    return jsonError(res, 400, 'Invalid order status request');
  }

  try {
    const decoded = await verifyFirebaseIdToken(authorization.slice(7).trim());
    const app = getFirebaseAdminApp();
    const firestore = getFirestore(app);
    const profile = await firestore.collection('users').doc(decoded.uid).get();
    if (!profile.exists || profile.data()?.role !== 'admin') return jsonError(res, 403, 'Admin role required');

    // Legacy DELETE compatibility. The current frontend should use
    // POST /api/admin/delete-orders for deletions.
    if (isDelete) {
      const orderRefs = orderIds.map((id) => firestore.collection('orders').doc(id));
      await firestore.runTransaction(async (transaction) => {
        const snapshots = await Promise.all(orderRefs.map((ref) => transaction.get(ref)));
        if (snapshots.some((snapshot) => !snapshot.exists)) {
          throw new OrderStatusError(404, 'One or more orders were not found');
        }
        orderRefs.forEach((ref) => transaction.delete(ref));
      });
      return res.status(200).json({ success: true, deletedOrderIds: orderIds });
    }

    const orderId = (body!.orderId as string).trim();
    const nextStatus = body!.status as string;
    const orderRef = firestore.collection('orders').doc(orderId);
    await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(orderRef);
      if (!snapshot.exists) throw new OrderStatusError(404, 'Order not found');
      const order = snapshot.data() ?? {};
      const currentStatus = typeof order.status === 'string' ? order.status : '';
      if (!VALID_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
        throw new OrderStatusError(409, 'Invalid order status transition');
      }

      if (nextStatus === 'cancelled') {
        const items = Array.isArray(order.items) ? order.items as Array<Record<string, unknown>> : [];
        const restockItems = items.map((item) => {
          if (
            typeof item.productId !== 'string' ||
            !item.productId ||
            item.productId.length > 128 ||
            item.productId.includes('/') ||
            typeof item.quantity !== 'number' ||
            !Number.isSafeInteger(item.quantity) ||
            item.quantity < 1
          ) {
            throw new OrderStatusError(409, 'Order contains invalid restock data');
          }
          return { ref: firestore.collection('products').doc(item.productId), quantity: item.quantity };
        });
        // Firestore requires all transaction reads to finish before writes.
        const productSnapshots = await Promise.all(restockItems.map(({ ref }) => transaction.get(ref)));
        productSnapshots.forEach((productSnapshot, index) => {
          if (!productSnapshot.exists) return;
          const currentStock = productSnapshot.data()?.stock;
          const quantity = restockItems[index]!.quantity;
          if (typeof currentStock !== 'number' || !Number.isSafeInteger(currentStock) ||
              currentStock < 0 || !Number.isSafeInteger(currentStock + quantity)) {
            throw new OrderStatusError(409, 'Product contains invalid stock data');
          }
        });
        productSnapshots.forEach((productSnapshot, index) => {
          if (!productSnapshot.exists) return;
          const currentStock = productSnapshot.data()?.stock as number;
          transaction.update(restockItems[index]!.ref, {
            stock: currentStock + restockItems[index]!.quantity,
            updatedAt: FieldValue.serverTimestamp(),
          });
        });
      }

      const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      transaction.update(orderRef, {
        status: nextStatus,
        statusHistory: [
          ...history,
          { from: currentStatus, to: nextStatus, by: decoded.uid, timestamp: Timestamp.now() },
        ],
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return res.status(200).json({ success: true, orderId, status: nextStatus });
  } catch (error) {
    if (error instanceof OrderStatusError) return jsonError(res, error.status, error.message);
    if (error instanceof FirebaseTokenError) return jsonError(res, error.status, error.message);
    if (error instanceof FirebaseConfigurationError) {
      console.error('Firebase Admin configuration error:', error.message);
      return jsonError(res, 500, 'Firebase server configuration is incomplete');
    }
    console.error('Admin order operation failed:', error instanceof Error ? error.message : 'unknown error');
    return jsonError(res, 500, isDelete ? 'Unable to delete orders' : 'Unable to update order status');
  }
}
