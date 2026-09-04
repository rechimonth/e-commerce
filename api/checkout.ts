import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PAYMENT_METHODS = new Set(['card', 'paypal', 'cash']);

function getFirebaseAdminApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0]!;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) throw new Error('Firebase Admin environment is not configured');
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

function jsonError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}

function validAddress(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object') return false;
  const address = value as Record<string, unknown>;
  return ['street', 'city', 'state', 'zipCode', 'country'].every((key) => typeof address[key] === 'string' && address[key].trim().length > 0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return jsonError(res, 405, 'Método no permitido');

  const authHeader = req.headers.authorization ?? '';
  if (!authHeader.startsWith('Bearer ')) return jsonError(res, 401, 'Sesión requerida');
  const token = authHeader.slice(7).trim();
  if (!token) return jsonError(res, 401, 'Sesión requerida');

  try {
    const app = getFirebaseAdminApp();
    const decoded = await getAuth(app).verifyIdToken(token);
    const body = req.body as Record<string, unknown> | undefined;
    if (!body || !Array.isArray(body.items) || body.items.length === 0) return jsonError(res, 400, 'El carrito está vacío');
    if (!validAddress(body.shippingAddress) || !validAddress(body.billingAddress)) return jsonError(res, 400, 'La dirección de envío no es válida');
    if (typeof body.paymentMethod !== 'string' || !PAYMENT_METHODS.has(body.paymentMethod)) return jsonError(res, 400, 'Método de pago no válido');
    if (body.notes !== undefined && typeof body.notes !== 'string') return jsonError(res, 400, 'Las notas no son válidas');

    const requestedItems = body.items as unknown[];
    const parsedItems = requestedItems.map((entry) => {
      if (!entry || typeof entry !== 'object') throw new Error('ITEM_INVALID');
      const item = entry as Record<string, unknown>;
      if (typeof item.productId !== 'string' || !item.productId.trim() || typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity < 1) throw new Error('ITEM_INVALID');
      return { productId: item.productId, quantity: item.quantity };
    });

    const uniqueIds = new Set(parsedItems.map((item) => item.productId));
    if (uniqueIds.size !== parsedItems.length) return jsonError(res, 400, 'Hay productos duplicados en el pedido');

    const firestore = getFirestore(app);
    const orderRef = firestore.collection('orders').doc();
    const now = Date.now();

    await firestore.runTransaction(async (transaction) => {
      const productRefs = parsedItems.map((item) => firestore.collection('products').doc(item.productId));
      const snapshots = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
      let subtotalCents = 0;
      let currency = 'USD';
      const orderItems: Array<Record<string, unknown>> = [];

      snapshots.forEach((snapshot, index) => {
        if (!snapshot.exists) throw new Error('PRODUCT_NOT_FOUND');
        const data = snapshot.data() ?? {};
        const requested = parsedItems[index]!;
        const priceCents = data.priceCents ?? data.price_cents;
        const stock = data.stock;
        const name = data.name;
        const imageUrl = data.imageUrl ?? data.image_url ?? '';
        if (typeof priceCents !== 'number' || !Number.isInteger(priceCents) || priceCents < 0) throw new Error('PRODUCT_INVALID');
        if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < requested.quantity) throw new Error(`STOCK:${String(name ?? requested.productId)}`);
        if (typeof name !== 'string') throw new Error('PRODUCT_INVALID');
        const productCurrency = typeof data.currency === 'string' ? data.currency : 'USD';
        if (index === 0) currency = productCurrency;
        if (productCurrency !== currency) throw new Error('CURRENCY_MISMATCH');
        subtotalCents += priceCents * requested.quantity;
        orderItems.push({ productId: requested.productId, name, priceCents, quantity: requested.quantity, imageUrl: typeof imageUrl === 'string' ? imageUrl : '', orderId: orderRef.id });
        transaction.update(productRefs[index]!, { stock: stock - requested.quantity, updatedAt: FieldValue.serverTimestamp() });
      });

      transaction.set(orderRef, {
        id: orderRef.id,
        userId: decoded.uid,
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
    const message = error instanceof Error ? error.message : '';
    if (message === 'PRODUCT_NOT_FOUND') return jsonError(res, 404, 'Uno de los productos ya no está disponible');
    if (message === 'PRODUCT_INVALID') return jsonError(res, 409, 'Uno de los productos tiene datos inválidos');
    if (message === 'CURRENCY_MISMATCH') return jsonError(res, 409, 'Los productos del pedido usan monedas diferentes');
    if (message === 'ITEM_INVALID') return jsonError(res, 400, 'El carrito contiene datos inválidos');
    if (message.startsWith('STOCK:')) return jsonError(res, 409, `Stock insuficiente para ${message.slice(6)}`);
    console.error('Checkout failed:', message || 'unknown');
    return jsonError(res, 500, 'No pudimos completar el pedido. Intenta nuevamente.');
  }
}
