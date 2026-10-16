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

function normalizeReviewText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * Firestore-only review moderation. The policy is stored in
 * settings/reviewModeration and managed by an administrator. No third-party
 * moderation API or additional API key is used.
 */
async function moderateReviewComment(
  firestore: ReturnType<typeof getFirestore>,
  comment: string,
): Promise<void> {
  const normalized = normalizeReviewText(comment);
  if (!normalized) {
    throw new ReviewRequestError(422, 'El comentario no contiene texto válido');
  }

  // Baseline anti-spam controls remain active even before an admin configures
  // the Firestore blocklist.
  const urlCount = (comment.match(/(?:https?:\/\/|www\.)\S+/giu) ?? []).length;
  if (urlCount > 0) {
    throw new ReviewRequestError(422, 'No se permiten enlaces en las reseñas');
  }
  if (/(.)\1{9,}/u.test(comment.replace(/\s/g, ''))) {
    throw new ReviewRequestError(422, 'El comentario parece spam por repetición de caracteres');
  }

  const policyRef = firestore.collection('settings').doc('reviewModeration');
  const defaultPolicy = {
    blockedTerms: [
      'puta', 'puto', 'mierda', 'imbecil', 'estupido', 'estupida', 'pendejo',
      'pelotudo', 'boludo', 'forro', 'hdp', 'hijo de puta', 'malparido',
      'fuck', 'fucking', 'shit', 'bitch', 'asshole', 'motherfucker',
      'nigger', 'faggot', 'retard',
    ],
    maxLength: 1500,
  };

  let policy: Record<string, unknown>;
  try {
    const policySnapshot = await policyRef.get();
    if (policySnapshot.exists) {
      policy = policySnapshot.data() ?? {};
    } else {
      // Bootstrap the policy in Firestore using the existing Firebase Admin
      // credentials. This avoids requiring another API key or a manual seed.
      await policyRef.set({
        ...defaultPolicy,
        updatedAt: FieldValue.serverTimestamp(),
      });
      policy = defaultPolicy;
    }
  } catch {
    throw new ReviewRequestError(503, 'No se pudo verificar el comentario en Firestore. Inténtalo nuevamente');
  }

  const blockedTerms = Array.isArray(policy.blockedTerms)
    ? policy.blockedTerms.filter((term): term is string =>
        typeof term === 'string' && term.trim().length > 0 && term.trim().length <= 80)
    : defaultPolicy.blockedTerms;

  const matchedTerm = blockedTerms.some((term) => {
    const normalizedTerm = normalizeReviewText(term);
    return normalizedTerm.length > 0 && ` ${normalized} `.includes(` ${normalizedTerm} `);
  });
  if (matchedTerm) {
    throw new ReviewRequestError(422, 'El comentario contiene términos que no están permitidos por la política de reseñas');
  }

  const maxLength = typeof policy.maxLength === 'number' && Number.isSafeInteger(policy.maxLength)
    ? Math.max(10, Math.min(policy.maxLength, 1500))
    : 1500;
  if (comment.trim().length > maxLength) {
    throw new ReviewRequestError(422, \`El comentario supera el límite de \${maxLength} caracteres\`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method ?? '')) return jsonError(res, 405, 'Método no permitido');
  const authorization = req.headers.authorization ?? '';
  if (!authorization.startsWith('Bearer ')) return jsonError(res, 401, 'Debes iniciar sesión');

  if (req.method === 'GET') {
    const productId = typeof req.query.productId === 'string' ? req.query.productId.trim() : '';
    if (!productId || productId.length > 128 || productId.includes('/')) return jsonError(res, 400, 'Producto no válido');
    try {
      const decoded = await verifyFirebaseIdToken(authorization.slice(7).trim());
      const firestore = getFirestore(getFirebaseAdminApp());
      const owner = await firestore.collection('reviewOwners').doc(`${productId}_${decoded.uid}`).get();
      const reviewId = owner.exists && typeof owner.data()?.reviewId === 'string' ? owner.data()!.reviewId as string : null;
      return res.status(200).json({ success: true, reviewId });
    } catch (error) {
      if (error instanceof FirebaseTokenError) return jsonError(res, error.status, error.message);
      if (error instanceof FirebaseConfigurationError) return jsonError(res, 500, 'La configuración del servidor está incompleta');
      return jsonError(res, 500, 'No se pudo consultar tu reseña');
    }
  }

  if (req.method === 'DELETE') {
    const body = req.body as { productId?: unknown } | undefined;
    if (!body || typeof body.productId !== 'string' || !body.productId.trim() || body.productId.length > 128 || body.productId.includes('/')) {
      return jsonError(res, 400, 'Producto no válido');
    }
    try {
      const decoded = await verifyFirebaseIdToken(authorization.slice(7).trim());
      const firestore = getFirestore(getFirebaseAdminApp());
      const productId = body.productId.trim();
      const ownerRef = firestore.collection('reviewOwners').doc(`${productId}_${decoded.uid}`);
      const productRef = firestore.collection('products').doc(productId);
      await firestore.runTransaction(async (transaction) => {
        const [ownerSnapshot, productSnapshot] = await Promise.all([
          transaction.get(ownerRef),
          transaction.get(productRef),
        ]);
        if (!ownerSnapshot.exists) throw new ReviewRequestError(404, 'No tienes una reseña para eliminar');
        const reviewId = ownerSnapshot.data()?.reviewId;
        if (typeof reviewId !== 'string' || !reviewId) throw new Error('Invalid review owner mapping');
        const reviewRef = firestore.collection('productReviews').doc(reviewId);
        const reviewSnapshot = await transaction.get(reviewRef);
        const previousRating = reviewSnapshot.data()?.rating;
        if (productSnapshot.exists && typeof previousRating === 'number') {
          const product = productSnapshot.data() ?? {};
          const oldCount = typeof product.reviewCount === 'number' && Number.isSafeInteger(product.reviewCount) ? Math.max(0, product.reviewCount) : 0;
          const oldRating = typeof product.rating === 'number' ? product.rating : 0;
          const nextCount = Math.max(0, oldCount - 1);
          const nextRating = nextCount > 0 ? Math.round(((oldRating * oldCount - previousRating) / nextCount) * 100) / 100 : 0;
          transaction.update(productRef, { rating: Math.max(0, Math.min(5, nextRating)), reviewCount: nextCount, updatedAt: FieldValue.serverTimestamp() });
        }
        if (reviewSnapshot.exists) transaction.delete(reviewRef);
        transaction.delete(ownerRef);
      });
      return res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof ReviewRequestError) return jsonError(res, error.status, error.message);
      if (error instanceof FirebaseTokenError) return jsonError(res, error.status, error.message);
      if (error instanceof FirebaseConfigurationError) return jsonError(res, 500, 'La configuración del servidor está incompleta');
      console.error('Review deletion failed:', error instanceof Error ? error.message : 'unknown error');
      return jsonError(res, 500, 'No se pudo eliminar la reseña');
    }
  }

  if (req.method !== 'POST') return jsonError(res, 405, 'Método no permitido');

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
    await moderateReviewComment(firestore, comment);

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
