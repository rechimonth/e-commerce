import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PAYMENT_METHODS = new Set(['card', 'paypal', 'cash']);

class UnauthorizedCheckoutError extends Error {
  constructor() {
    super('Sesión inválida o expirada');
    this.name = 'UnauthorizedCheckoutError';
  }
}

class FirebaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseConfigurationError';
  }
}

class CheckoutRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'CheckoutRequestError';
  }
}

function normalizePrivateKey(value: string): string {
  let key = value.trim();

  // Vercel can receive the service-account key with literal \\n sequences,
  // real line breaks, or an extra pair of wrapping quotes.
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  return key
    .replace(/\\r?\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .trim();
}

function getFirebaseAdminApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0]!;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();

  if (serviceAccountJson) {
    try {
      const credentials = JSON.parse(serviceAccountJson) as {
        project_id?: unknown;
        client_email?: unknown;
        private_key?: unknown;
      };

      const projectId = typeof credentials.project_id === 'string' ? credentials.project_id : '';
      const clientEmail = typeof credentials.client_email === 'string' ? credentials.client_email : '';
      const privateKey = typeof credentials.private_key === 'string' ? normalizePrivateKey(credentials.private_key) : '';

      if (!projectId || !clientEmail || !privateKey) {
        throw new FirebaseConfigurationError('FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields');
      }

      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
        throw new FirebaseConfigurationError('FIREBASE_SERVICE_ACCOUNT_JSON contains an invalid private key');
      }

      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      if (error instanceof FirebaseConfigurationError) throw error;
      throw new FirebaseConfigurationError('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyValue = process.env.FIREBASE_PRIVATE_KEY;

  const missing = [
    !projectId ? 'FIREBASE_PROJECT_ID (or VITE_FIREBASE_PROJECT_ID)' : null,
    !clientEmail ? 'FIREBASE_CLIENT_EMAIL' : null,
    !privateKeyValue ? 'FIREBASE_PRIVATE_KEY' : null,
  ].filter((value): value is string => Boolean(value));

  if (missing.length > 0) {
    throw new FirebaseConfigurationError(`Missing Firebase Admin environment variables: ${missing.join(', ')}`);
  }

  const privateKey = normalizePrivateKey(privateKeyValue ?? '');

  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
    throw new FirebaseConfigurationError('FIREBASE_PRIVATE_KEY has an invalid format');
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

/**
 * Validates a Firebase ID token without loading firebase-admin/auth.
 * This avoids the jwks-rsa -> jose CommonJS/ESM incompatibility on Vercel.
 * Firebase's Identity Toolkit API validates the token for the project tied
 * to the Web API key and returns the authenticated user's Firebase UID.
 */
async function verifyFirebaseIdToken(token: string): Promise<{ uid: string }> {
  const configuredApiKey = process.env.FIREBASE_WEB_API_KEY ?? process.env.VITE_FIREBASE_API_KEY;

  if (!configuredApiKey) {
    throw new FirebaseConfigurationError('Firebase Web API key is not configured');
  }

  let response: Response;

  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(configuredApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      },
    );
  } catch {
    throw new Error('No se pudo verificar la sesión con Firebase');
  }

  const payload = (await response.json().catch(() => null)) as
    | { users?: Array<{ localId?: string; disabled?: boolean }> }
    | { error?: { message?: string } }
    | null;

  if (!response.ok) {
    throw new UnauthorizedCheckoutError();
  }

  const user = payload && 'users' in payload ? payload.users?.[0] : undefined;

  if (!user?.localId || user.disabled) {
    throw new UnauthorizedCheckoutError();
  }

  return { uid: user.localId };
}

function jsonError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}

function validAddress(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object') return false;
  const address = value as Record<string, unknown>;
  const allowedKeys = ['street', 'city', 'state', 'zipCode', 'country'];
  return Object.keys(address).every((key) => allowedKeys.includes(key))
    && allowedKeys.every((key) => typeof address[key] === 'string'
      && address[key].trim().length > 0
      && address[key].length <= 200);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return jsonError(res, 405, 'Método no permitido');

  const authHeader = req.headers.authorization ?? '';
  if (!authHeader.startsWith('Bearer ')) return jsonError(res, 401, 'Sesión requerida');
  const token = authHeader.slice(7).trim();
  if (!token) return jsonError(res, 401, 'Sesión requerida');

  try {
    const app = getFirebaseAdminApp();
    const decoded = await verifyFirebaseIdToken(token);
    const body = req.body as Record<string, unknown> | undefined;
    if (!body || !Array.isArray(body.items) || body.items.length === 0) return jsonError(res, 400, 'El carrito está vacío');
    if (body.items.length > 100) return jsonError(res, 400, 'El pedido supera el máximo de productos permitido');
    if (!validAddress(body.shippingAddress) || !validAddress(body.billingAddress)) return jsonError(res, 400, 'La dirección de envío no es válida');
    if (typeof body.paymentMethod !== 'string' || !PAYMENT_METHODS.has(body.paymentMethod)) return jsonError(res, 400, 'Método de pago no válido');
    if (body.notes !== undefined && (typeof body.notes !== 'string' || body.notes.length > 1000)) return jsonError(res, 400, 'Las notas no son válidas');

    const firestore = getFirestore(app);
    let orderUserId = decoded.uid;
    if (body.targetUserId !== undefined) {
      if (typeof body.targetUserId !== 'string' || !body.targetUserId.trim() || body.targetUserId.length > 128) {
        return jsonError(res, 400, 'El usuario destino no es válido');
      }
      if (body.targetUserId !== decoded.uid) {
        const [callerProfile, targetProfile] = await Promise.all([
          firestore.collection('users').doc(decoded.uid).get(),
          firestore.collection('users').doc(body.targetUserId).get(),
        ]);
        if (!callerProfile.exists || callerProfile.data()?.role !== 'admin') {
          return jsonError(res, 403, 'Solo un administrador puede crear una orden para otro usuario');
        }
        if (!targetProfile.exists || targetProfile.data()?.role !== 'customer') {
          return jsonError(res, 404, 'No se encontró el cliente seleccionado');
        }
        orderUserId = body.targetUserId;
      }
    }

    const requestedItems = body.items as unknown[];
    const parsedItems = requestedItems.map((entry) => {
      if (!entry || typeof entry !== 'object') throw new CheckoutRequestError(400, 'Un producto del carrito no es válido');
      const item = entry as Record<string, unknown>;
      if (
        typeof item.productId !== 'string' ||
        !item.productId.trim() ||
        item.productId.length > 128 ||
        typeof item.quantity !== 'number' ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 1000
      ) {
        throw new CheckoutRequestError(400, 'Un producto del carrito no es válido');
      }
      return { productId: item.productId, quantity: item.quantity };
    });

    const uniqueIds = new Set(parsedItems.map((item) => item.productId));
    if (uniqueIds.size !== parsedItems.length) return jsonError(res, 400, 'Hay productos duplicados en el pedido');

    const orderRef = firestore.collection('orders').doc();
    const now = Date.now();

    await firestore.runTransaction(async (transaction) => {
      const productRefs = parsedItems.map((item) => firestore.collection('products').doc(item.productId));
      const snapshots = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
      let subtotalCents = 0;
      let currency = 'USD';
      const orderItems: Array<Record<string, unknown>> = [];

      snapshots.forEach((snapshot, index) => {
        if (!snapshot.exists) throw new CheckoutRequestError(404, 'Uno de los productos ya no está disponible');
        const data = snapshot.data() ?? {};
        const requested = parsedItems[index]!;
        const priceCents = data.priceCents ?? data.price_cents;
        const stock = data.stock;
        const name = data.name;
        const imageUrl = data.imageUrl ?? data.image_url ?? '';
        if (data.isActive !== true) throw new CheckoutRequestError(409, 'Uno de los productos ya no está disponible');
        if (typeof priceCents !== 'number' || !Number.isSafeInteger(priceCents) || priceCents < 0) throw new Error('PRODUCT_INVALID');
        if (typeof stock !== 'number' || !Number.isSafeInteger(stock) || stock < requested.quantity) {
          throw new CheckoutRequestError(409, `No hay stock suficiente para ${String(name ?? requested.productId)}`);
        }
        if (typeof name !== 'string') throw new Error('PRODUCT_INVALID');
        const productCurrency = typeof data.currency === 'string' ? data.currency : 'USD';
        if (index === 0) {
          if (!['USD', 'MXN', 'EUR', 'GBP', 'CAD'].includes(productCurrency)) throw new Error('PRODUCT_INVALID');
          currency = productCurrency;
        }
        if (productCurrency !== currency) throw new CheckoutRequestError(409, 'Los productos tienen monedas diferentes');
        const lineTotalCents = priceCents * requested.quantity;
        if (!Number.isSafeInteger(lineTotalCents) || !Number.isSafeInteger(subtotalCents + lineTotalCents)) {
          throw new Error('PRODUCT_INVALID');
        }
        subtotalCents += lineTotalCents;
        orderItems.push({ productId: requested.productId, name, priceCents, quantity: requested.quantity, imageUrl: typeof imageUrl === 'string' ? imageUrl : '', orderId: orderRef.id });
        transaction.update(productRefs[index]!, { stock: stock - requested.quantity, updatedAt: FieldValue.serverTimestamp() });
      });

      transaction.set(orderRef, {
        id: orderRef.id,
        userId: orderUserId,
        items: orderItems,
        subtotalCents,
        taxCents: 0,
        shippingCents: 0,
        discountCents: 0,
        totalCents: subtotalCents,
        currency,
        status: 'pending',
        statusHistory: [],
        shippingAddress: body.shippingAddress,
        billingAddress: body.billingAddress,
        paymentMethod: body.paymentMethod,
        ...(typeof body.notes === 'string' && body.notes.trim() ? { notes: body.notes.trim() } : {}),
        createdAt: now,
        updatedAt: now,
      });
    });

    return res.status(200).json({ success: true, orderId: orderRef.id });
  } catch (error) {
    if (error instanceof UnauthorizedCheckoutError) return jsonError(res, 401, error.message);
    if (error instanceof CheckoutRequestError) return jsonError(res, error.status, error.message);
    if (error instanceof FirebaseConfigurationError) {
      console.error('Checkout Firebase configuration error:', error.message);
      return jsonError(res, 500, 'La configuración de Firebase del servidor está incompleta.');
    }
    console.error('Checkout API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}
