import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import type { DocumentReference, DocumentSnapshot } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PAYMENT_METHODS = new Set(['card', 'paypal', 'cash']);
const CURRENCY = 'USD';

interface AddressInput {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
interface CheckoutItemInput { productId: string; quantity: number; }
interface CheckoutBody {
  items: CheckoutItemInput[];
  shippingAddress: AddressInput;
  billingAddress: AddressInput;
  paymentMethod: string;
  notes?: string;
}

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

function isAddress(value: unknown): value is AddressInput {
  if (!value || typeof value !== 'object') return false;
  const address = value as Record<string, unknown>;
  return ['street', 'city', 'state', 'zipCode', 'country'].every(
    (key) => typeof address[key] === 'string' && (address[key] as string).trim().length > 0,
  );
}

function parseBody(body: unknown): CheckoutBody | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  if (!Array.isArray(value.items) || value.items.length === 0 || value.items.length > 50) return null;
  if (!isAddress(value.shippingAddress) || !isAddress(value.billingAddress)) return null;
  if (typeof value.paymentMethod !== 'string' || !PAYMENT_METHODS.has(value.paymentMethod)) return null;
  if (value.notes !== undefined || typeof value.notes === 'string') {
    if (typeof value.notes !== 'string') return null;
  }

  const items: CheckoutItemInput[] = [];
  for (const rawItem of value.items) {
    if (!rawItem || typeof rawItem !== 'object') return null;
    const item = rawItem as Record<string, unknown>;
    if (
      typeof item.productId !== 'string' || !item.productId.trim() ||
      typeof item.quantity !== 'number' || !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 || item.quantity > 1000
    ) return null;
    items.push({ productId: item.productId.trim(), quantity: item.quantity });
  }
  return {
    items,
    shippingAddress: value.shippingAddress as AddressInput,
    billingAddress: value.billingAddress as AddressInput,
    paymentMethod: value.paymentMethod,
    notes: value.notes as string | undefined,
  };
}

function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const configured = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((v) => v.trim()).filter(Boolean);
  const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
  if (origin && (configured.includes(origin) || origin === vercelOrigin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');

  const authHeader = req.headers.authorization ?? '';
  if (!authHeader.startsWith('Bearer ')) return jsonError(res, 401, 'Missing or invalid authorization header');
  const token = authHeader.slice(7).trim();
  if (!token) return jsonError(res, 401, 'Missing Firebase ID token');

  let uid: string;
  try {
    const decoded = await getAuth(getFirebaseAdminApp()).verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return jsonError(res, 401, 'Invalid Firebase ID token');
  }

  const body = parseBody(req.body);
  if (!body) return jsonError(res, 400, 'Invalid checkout data');

  try {
    const db = getFirestore(getFirebaseAdminApp());
    const orderRef = db.collection('orders').doc();
    const productRefs = new Map<string, DocumentReference>();
    for (const item of body.items) productRefs.set(item.productId, db.collection('products').doc(item.productId));

    const result = await db.runTransaction(async (transaction) => {
      const productSnapshots = new Map<string, DocumentSnapshot>();
      for (const [productId, ref] of productRefs) productSnapshots.set(productId, await transaction.get(ref));

      const quantities = new Map<string, number>();
      for (const item of body.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);

      const now = Date.now();
      const orderItems: Array<{
        productId: string; name: string; priceCents: number; quantity: number; imageUrl: string; orderId: string;
      }> = [];
      let subtotalCents = 0;

      for (const [productId, requestedQuantity] of quantities) {
        const snapshot = productSnapshots.get(productId);
        if (!snapshot?.exists) throw new Error(`PRODUCT_NOT_FOUND:${productId}`);
        const product = snapshot.data() ?? {};
        const stock = product.stock;
        const priceCents = product.priceCents;
        const name = product.name;
        const imageUrl = product.imageUrl ?? '';
        if (
          typeof stock !== 'number' || !Number.isSafeInteger(stock) || stock < 0 ||
          typeof priceCents !== 'number' || !Number.isSafeInteger(priceCents) || priceCents < 0 ||
          typeof name !== 'string' || typeof imageUrl !== 'string'
        ) throw new Error(`PRODUCT_INVALID:${productId}`);
        if (product.isActive !== true) throw new Error(`PRODUCT_INACTIVE:${name}`);
        if (stock < requestedQuantity) throw new Error(`INSUFFICIENT_STOCK:${name}:${stock}`);

        const lineTotal = priceCents * requestedQuantity;
        if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(subtotalCents + lineTotal)) throw new Error('ORDER_TOTAL_TOO_LARGE');
        subtotalCents += lineTotal;
        orderItems.push({ productId, name, priceCents, quantity: requestedQuantity, imageUrl, orderId: orderRef.id });
      }

      const statusHistory = [{ from: 'pending', to: 'pending', by: uid, timestamp: now }];
      transaction.set(orderRef, {
        id: orderRef.id, userId: uid, items: orderItems,
        subtotalCents, taxCents: 0, shippingCents: 0, discountCents: 0, totalCents: subtotalCents,
        currency: CURRENCY, status: 'pending', statusHistory,
        shippingAddress: body.shippingAddress, billingAddress: body.billingAddress,
        paymentMethod: body.paymentMethod, notes: body.notes, createdAt: now, updatedAt: now,
      });

      for (const [productId, quantity] of quantities) {
        const ref = productRefs.get(productId)!;
        const currentStock = productSnapshots.get(productId)!.data()!.stock as number;
        transaction.update(ref, { stock: currentStock - quantity, updatedAt: FieldValue.serverTimestamp() });
      }

      return {
        id: orderRef.id, userId: uid, items: orderItems,
        subtotalCents, taxCents: 0, shippingCents: 0, discountCents: 0, totalCents: subtotalCents,
        currency: CURRENCY, status: 'pending', statusHistory,
        shippingAddress: body.shippingAddress, billingAddress: body.billingAddress,
        paymentMethod: body.paymentMethod, notes: body.notes, createdAt: now, updatedAt: now,
      };
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown checkout error';
    if (message.startsWith('PRODUCT_NOT_FOUND:')) return jsonError(res, 404, 'Producto no disponible');
    if (message.startsWith('PRODUCT_INACTIVE:')) return jsonError(res, 409, 'Uno de los productos ya no está disponible');
    if (message.startsWith('INSUFFICIENT_STOCK:')) {
      const [, name, stock] = message.split(':');
      return jsonError(res, 409, `Stock insuficiente para ${name}. Disponible: ${stock}`);
    }
    if (message.startsWith('PRODUCT_INVALID:')) return jsonError(res, 409, 'Uno de los productos tiene datos inválidos');
    if (message === 'ORDER_TOTAL_TOO_LARGE') return jsonError(res, 400, 'El total de la orden no es válido');
    console.error('Checkout transaction failed:', message);
    return jsonError(res, 500, 'No se pudo completar el checkout');
  }
}
