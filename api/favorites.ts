import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { FirebaseConfigurationError, getFirebaseAdminApp } from '../server/firebaseAdmin.js';
import { FirebaseTokenError, verifyFirebaseIdToken } from '../server/firebaseToken.js';

interface FavoriteBody {
  readonly productId: string;
}

function jsonError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}

function parseFavoriteBody(value: unknown): FavoriteBody | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => key !== 'productId')) return null;
  if (
    typeof body.productId !== 'string' ||
    body.productId.trim().length === 0 ||
    body.productId.length > 128 ||
    body.productId.includes('/')
  ) {
    return null;
  }
  return { productId: body.productId.trim() };
}

function timestampMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    const toMillis = (value as { toMillis?: () => number }).toMillis;
    if (typeof toMillis === 'function') return toMillis.call(value);
  }
  return 0;
}

/**
 * User-scoped favorites endpoint. The target UID always comes from the
 * verified Firebase ID token, never from the request body or query string.
 * The API also avoids depending on client-side Firestore rules being deployed.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method ?? '')) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return jsonError(res, 405, 'Method not allowed');
  }

  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return jsonError(res, 401, 'Authentication required');
  }

  const token = authorization.slice(7).trim();
  if (!token) return jsonError(res, 401, 'Authentication required');

  try {
    const decoded = await verifyFirebaseIdToken(token);
    const firestore = getFirestore(getFirebaseAdminApp());
    const favorites = firestore.collection('users').doc(decoded.uid).collection('favorites');

    if (req.method === 'GET') {
      const snapshot = await favorites.get();
      const ids = snapshot.docs
        .map((document) => {
          const data = document.data();
          return {
            id: document.id,
            productId: data.productId,
            createdAt: timestampMillis(data.createdAt),
          };
        })
        .filter((favorite) => favorite.productId === favorite.id)
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((favorite) => favorite.id);

      return res.status(200).json({ success: true, data: { favoriteIds: ids } });
    }

    const body = parseFavoriteBody(req.body);
    if (!body) return jsonError(res, 400, 'Invalid product id');

    const favorite = favorites.doc(body.productId);
    if (req.method === 'POST') {
      await favorite.set({
        productId: body.productId,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      await favorite.delete();
    }

    return res.status(200).json({
      success: true,
      data: { productId: body.productId },
    });
  } catch (error) {
    if (error instanceof FirebaseTokenError) {
      return jsonError(res, error.status, error.message);
    }
    if (error instanceof FirebaseConfigurationError) {
      console.error('Favorites API configuration error:', error.message);
      return jsonError(res, 500, 'Firebase server configuration is incomplete');
    }
    console.error('Favorites API request failed:', error instanceof Error ? error.message : 'unknown error');
    return jsonError(res, 500, 'Unable to update favorites');
  }
}
