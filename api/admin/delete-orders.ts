import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminError, requireAdmin } from '../../server/adminAuthorization.js';

class DeleteOrdersError extends Error {
  constructor(
    readonly status: 404,
    message: string,
  ) {
    super(message);
    this.name = 'DeleteOrdersError';
  }
}

function jsonError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}

/** Permanently removes order documents from Firestore for an authenticated admin. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return jsonError(res, 405, 'Method not allowed. Use POST');
  }

  const body = req.body as { orderIds?: unknown } | undefined;
  if (!body || !Array.isArray(body.orderIds) || body.orderIds.length < 1 || body.orderIds.length > 100) {
    return jsonError(res, 400, 'orderIds must contain between 1 and 100 order ids');
  }

  const orderIds = body.orderIds.map((value) => typeof value === 'string' ? value.trim() : '');
  if (
    orderIds.some((id) => !id || id.length > 128 || id.includes('/')) ||
    new Set(orderIds).size !== orderIds.length
  ) {
    return jsonError(res, 400, 'Invalid order ids');
  }

  try {
    const { firestore } = await requireAdmin(req);
    const orderRefs = orderIds.map((id) => firestore.collection('orders').doc(id));
    const deletedOrderIds = await firestore.runTransaction(async (transaction) => {
      const snapshots = await Promise.all(orderRefs.map((ref) => transaction.get(ref)));
      if (snapshots.some((snapshot) => !snapshot.exists)) {
        throw new DeleteOrdersError(404, 'One or more orders were not found');
      }

      orderRefs.forEach((ref) => transaction.delete(ref));
      return orderIds;
    });

    return res.status(200).json({ success: true, deletedOrderIds });
  } catch (error) {
    if (error instanceof DeleteOrdersError) return jsonError(res, error.status, error.message);
    const { status, message } = getAdminError(error);
    if (status >= 500) {
      console.error('Admin order deletion failed:', error instanceof Error ? error.message : 'unknown error');
    }
    return jsonError(res, status, message);
  }
}
