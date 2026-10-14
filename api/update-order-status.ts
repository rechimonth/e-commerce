import { FirebaseConfigurationError, getFirebaseAdminApp } from '../server/firebaseAdmin.js';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
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
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');
  const authorization = req.headers.authorization ?? '';
  if (!authorization.startsWith('Bearer ')) return jsonError(res, 401, 'Authentication required');
  const body = req.body as { orderId?: unknown; status?: unknown } | undefined;
  if (
    !body || typeof body.orderId !== 'string' || !body.orderId.trim() || body.orderId.length > 128
    || typeof body.status !== 'string' || !Object.hasOwn(VALID_TRANSITIONS, body.status)
  ) {
    return jsonError(res, 400, 'Invalid order status request');
  }

  try {
    const app = getFirebaseAdminApp();
    const decoded = await getAuth(app).verifyIdToken(authorization.slice(7).trim());
    const firestore = getFirestore(app);
    const [profile] = await Promise.all([
      firestore.collection('users').doc(decoded.uid).get(),
    ]);
    if (!profile.exists || profile.data()?.role !== 'admin') return jsonError(res, 403, 'Admin role required');

    const orderRef = firestore.collection('orders').doc(body.orderId);
    await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(orderRef);
      if (!snapshot.exists) throw new OrderStatusError(404, 'Order not found');
      const order = snapshot.data() ?? {};
      const currentStatus = typeof order.status === 'string' ? order.status : '';
      if (!VALID_TRANSITIONS[currentStatus]?.includes(body.status as string)) {
        throw new OrderStatusError(409, 'Invalid order status transition');
      }

      const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      transaction.update(orderRef, {
        status: body.status,
        statusHistory: [
          ...history,
          { from: currentStatus, to: body.status, by: decoded.uid, timestamp: FieldValue.serverTimestamp() },
        ],
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return res.status(200).json({ success: true, orderId: body.orderId, status: body.status });
  } catch (error) {
    if (error instanceof OrderStatusError) return jsonError(res, error.status, error.message);
    if (error instanceof FirebaseConfigurationError) {
      console.error('Firebase Admin configuration error:', error.message);
      return jsonError(res, 500, 'Firebase server configuration is incomplete');
    }
    console.error('Admin order status update failed:', error instanceof Error ? error.message : 'unknown error');
    return jsonError(res, 401, 'Unable to update order status');
  }
}
