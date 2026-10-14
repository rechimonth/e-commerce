/**
 * Per-user cloud backup for the shopping cart.
 *
 * Firestore is the cross-device source of truth after hydration; localStorage
 * remains a fast/offline cache. Checkout still revalidates product prices and
 * stock on the server, so cart snapshots are never trusted for order totals.
 */
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/infrastructure/firebase/config';
import { calculateTotal, calculateTotalItems, createInitialCartState } from '@/utils/cart/cartUtils';
import type { CartItem, CartState } from '@/types/cart';
import type { CurrencyCode, Money } from '@/types/pricing';

const CART_DOCUMENT_VERSION = 1;
const MAX_CART_ITEMS = 100;
const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = ['USD', 'MXN', 'EUR', 'GBP', 'CAD'];
const pendingWrites = new Map<string, Promise<void>>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMoney(value: unknown): value is Money {
  if (!isRecord(value)) return false;
  return typeof value.amount === 'number'
    && Number.isFinite(value.amount)
    && value.amount >= 0
    && typeof value.currency === 'string'
    && SUPPORTED_CURRENCIES.includes(value.currency as CurrencyCode);
}

function isCartItem(value: unknown): value is CartItem {
  if (!isRecord(value) || !isMoney(value.price) || !isRecord(value.image)) return false;
  return typeof value.productId === 'string'
    && value.productId.length > 0
    && value.productId.length <= 128
    && typeof value.name === 'string'
    && value.name.length <= 160
    && Number.isSafeInteger(value.quantity)
    && (value.quantity as number) > 0
    && Number.isSafeInteger(value.maxStock)
    && (value.maxStock as number) > 0
    && (value.quantity as number) <= (value.maxStock as number)
    && typeof value.image.url === 'string'
    && typeof value.image.alt === 'string'
    && typeof value.image.key === 'string';
}

function parseDate(value: unknown): Date {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? new Date() : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  if (isRecord(value) && typeof value.toDate === 'function') {
    try {
      const parsed = (value.toDate as () => Date)();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
    } catch {
      return new Date();
    }
  }
  return new Date();
}

export async function loadCartFromCloud(userId: string): Promise<CartState | null> {
  if (!userId) return null;
  const snapshot = await getDoc(doc(getFirebaseDb(), 'carts', userId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as Record<string, unknown>;
  if (data.version !== CART_DOCUMENT_VERSION || !Array.isArray(data.items) || data.items.length > MAX_CART_ITEMS) {
    return null;
  }

  const items = data.items.filter(isCartItem);
  const fallback = createInitialCartState();
  const discount = isMoney(data.discount) ? data.discount : fallback.discount;
  const totals = calculateTotal(items, discount);

  return {
    items,
    discount,
    totalItems: calculateTotalItems(items),
    totalPrice: totals.total,
    lastUpdated: parseDate(data.lastUpdated),
  };
}

export function saveCartToCloud(userId: string, state: CartState): Promise<void> {
  if (!userId) return Promise.reject(new Error('A user ID is required to sync the cart'));

  const previous = pendingWrites.get(userId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(async () => {
    const reference = doc(getFirebaseDb(), 'carts', userId);
    if (state.items.length === 0) {
      await deleteDoc(reference);
      return;
    }

    await setDoc(reference, {
      version: CART_DOCUMENT_VERSION,
      items: state.items.slice(0, MAX_CART_ITEMS),
      discount: state.discount,
      lastUpdated: state.lastUpdated.toISOString(),
    });
  });

  pendingWrites.set(userId, next);
  return next.finally(() => {
    if (pendingWrites.get(userId) === next) pendingWrites.delete(userId);
  });
}
