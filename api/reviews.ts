import { FirebaseConfigurationError, getFirebaseAdminApp } from '../server/firebaseAdmin.js';
import { FirebaseTokenError, verifyFirebaseIdToken } from '../server/firebaseToken.js';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

class ReviewRequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ReviewRequestError';
  }
}

function jsonError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return jsonError(res, 405, 'Método no permitido');
  const authorization = req.headers.authorization ?? '';
  if (!authorization.startsWith('Bearer ')) return jsonError(res, 401, 'Debes iniciar sesión');

  const body = req.body as { productId?: unknown; rating?: unknown; comment?: unknown } | undefined;
  if (
    !body ||
    typeof body.productId !== 'string' ||
    !body.productId.trim() ||
    body.productId.length > 128 ||
    typeof body.rating !== 'number' ||
    !Number.isSafeInteger(body.rating) ||
    body.rating < 1 ||
    body.rating > 5 ||
    typeof body.comment !== 'string' ||
    body.comment.trim().length < 10 ||
    body.comment.trim().length > 1500
  ) {
    return jsonError(res, 400, 'La reseña debe incluir producto, una puntuación de 1 a 5 y un comentario de 10 a 1500 caracteres');
  }

  const productId = body.productId.trim();
  const rating = body.rating;
  const comment = body.comment.trim();

  try {
    const decoded = await verifyFirebaseIdToken(authorization.slice(7).trim());
    const app = getFirebaseAdminApp();
    const firestore = getFirestore(app);
    const productRef = firestore.collection('products').doc(productId);
    const profileRef = firestore.collection('users').doc(decoded.uid);
    const ownerRef = firestore.collection('reviewOwners').doc(`${productId}_${decoded.uid}`);

    const [productSnapshot, profileSnapshot, completedOrders] = await Promise.all([
      productRef.get(),
      profileRef.get(),
      firestore.collection('orders')
        .where('userId', '==', decoded.uid)
        .where('status', '==', 'completed')
        .limit(200)
        .get(),
    ]);

    if (!productSnapshot.exists || productSnapshot.data()?.isActive !== true) {
      return jsonError(res, 404, 'Producto no encontrado o no disponible');
    }
    const hasPurchased = completedOrders.docs.some((order) => {
      const items = order.data().items;
      return Array.isArray(items) && items.some((item: { productId?: unknown }) => item?.productId === productId);
    });
    if (!hasPurchased) return jsonError(res, 403, 'Solo puedes reseñar productos de órdenes completadas');

    const displayName = typeof profileSnapshot.data()?.displayName === 'string'
      ? profileSnapshot.data()!.displayName.trim().slice(0, 80)
      : '';
    const publicReviews = firestore.collection('productReviews');
    const now = FieldValue.serverTimestamp();

    await firestore.runTransaction(async (transaction) => {
      const [ownerSnapshot, currentProductSnapshot] = await Promise.all([
        transaction.get(ownerRef),
        transaction.get(productRef),
      ]);
      if (!currentProductSnapshot.exists) throw new ReviewRequestError(404, 'Producto no encontrado');
      const product = currentProductSnapshot.data() ?? {};
      const oldCount = typeof product.reviewCount === 'number' && Number.isSafeInteger(product.reviewCount)
        ? Math.max(0, product.reviewCount)
        : 0;
      const oldRating = typeof product.rating === 'number' ? product.rating : 0;
      let reviewRef = publicReviews.doc();
      let previousRating: number | null = null;

      if (ownerSnapshot.exists) {
        const owner = ownerSnapshot.data() ?? {};
        if (typeof owner.reviewId !== 'string' || !owner.reviewId) {
          throw new Error('Invalid review owner mapping');
        }
        reviewRef = publicReviews.doc(owner.reviewId);
        const previousReview = await transaction.get(reviewRef);
        const previousData = previousReview.data();
        if (previousReview.exists && typeof previousData?.rating === 'number') {
          previousRating = previousData.rating;
        }
      }

      const nextCount = previousRating === null ? oldCount + 1 : Math.max(1, oldCount);
      const ratingSum = oldRating * oldCount - (previousRating ?? 0) + rating;
      const nextRating = Math.round((ratingSum / nextCount) * 100) / 100;
      transaction.set(reviewRef, {
        productId: productId,
        rating: rating,
        comment: comment,
        displayName: displayName || 'Cliente',
        createdAt: previousRating === null ? now : (ownerSnapshot.data()?.createdAt ?? now),
        updatedAt: now,
      }, { merge: true });
      transaction.set(ownerRef, {
        reviewId: reviewRef.id,
        createdAt: ownerSnapshot.exists ? (ownerSnapshot.data()?.createdAt ?? now) : now,
      }, { merge: true });
      transaction.update(productRef, {
        rating: nextRating,
        reviewCount: nextCount,
        updatedAt: now,
      });
    });

    return res.status(200).json({ success: true, message: 'Reseña guardada' });
  } catch (error) {
    if (error instanceof ReviewRequestError) return jsonError(res, error.status, error.message);
    if (error instanceof FirebaseTokenError) {
      return jsonError(res, error.status, error.status === 401 ? 'La sesión no es válida o ha expirado' : error.message);
    }
    if (error instanceof FirebaseConfigurationError) {
      console.error('Firebase Admin configuration error:', error.message);
      return jsonError(res, 500, 'La configuración del servidor está incompleta');
    }
    const errorCode = (error as { code?: unknown })?.code;
    if (typeof errorCode === 'string' && errorCode.startsWith('auth/')) {
      return jsonError(res, 401, 'La sesión no es válida o ha expirado');
    }
    console.error('Review submission failed:', error instanceof Error ? error.message : 'unknown error');
    return jsonError(res, 500, 'No se pudo guardar la reseña');
  }
}
