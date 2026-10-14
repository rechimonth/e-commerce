import { FirebaseConfigurationError, getFirebaseAdminApp } from '../server/firebaseAdmin.js';
import { FirebaseTokenError, verifyFirebaseIdToken } from '../server/firebaseToken.js';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

class CancellationError extends Error {
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
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');
  const authorization = req.headers.authorization ?? '';
  if (!authorization.startsWith('Bearer ')) return jsonError(res, 401, 'Authentication required');

  const body = req.body as { orderId?: unknown } | undefined;
  if (!body || typeof body.orderId !== 'string' || !body.orderId.trim() || body.orderId.length > 128) {
    return jsonError(res, 400, 'Invalid order id');
  }

  try {
    const decoded = await verifyFirebaseIdToken(authorization.slice(7).trim());
    const app = getFirebaseAdminApp();
    const firestore = getFirestore(app);
    const orderRef = firestore.collection('orders').doc(body.orderId);

    await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(orderRef);
      if (!snapshot.exists) throw new CancellationError(404, 'Order not found');
      const order = snapshot.data() ?? {};
      if (order.userId !== decoded.uid) throw new CancellationError(403, 'Order access denied');
      if (order.status !== 'pending') throw new CancellationError(409, 'Only pending orders can be cancelled');

      const items = Array.isArray(order.items) ? order.items as Array<Record<string, unknown>> : [];
      const restockItems = items.map((item) => {
        if (
          typeof item.productId !== 'string' ||
          !item.productId ||
          typeof item.quantity !== 'number' ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1
        ) {
          throw new Error('Order contains invalid restock data');
        }
        return {
          ref: firestore.collection('products').doc(item.productId),
          quantity: item.quantity,
        };
      });
      const productSnapshots = await Promise.all(restockItems.map(({ ref }) => transaction.get(ref)));

      productSnapshots.forEach((productSnapshot, index) => {
        if (!productSnapshot.exists) return;
        const product = productSnapshot.data() ?? {};
        const currentStock = product.stock;
        const quantity = restockItems[index]!.quantity;
        if (typeof currentStock !== 'number' || !Number.isSafeInteger(currentStock) || !Number.isSafeInteger(currentStock + quantity)) {
          throw new Error('Product contains invalid stock data');
        }
        transaction.update(restockItems[index]!.ref, {
          stock: currentStock + quantity,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      transaction.update(orderRef, {
        status: 'cancelled',
        statusHistory: [
          ...history,
          { from: 'pending', to: 'cancelled', by: decoded.uid, timestamp: FieldValue.serverTimestamp() },
        ],
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return res.status(200).json({ success: true, orderId: body.orderId });
  } catch (error) {
    if (error instanceof CancellationError) return jsonError(res, error.status, error.message);
    if (error instanceof FirebaseTokenError) return jsonError(res, error.status, error.message);
    if (error instanceof FirebaseConfigurationError) {
      console.error('Firebase Admin configuration error:', error.message);
      return jsonError(res, 500, 'Firebase server configuration is incomplete');
    }
    console.error('Order cancellation failed:', error instanceof Error ? error.message : 'unknown error');
    return jsonError(res, 401, 'Unable to cancel this order');
  }
}
