/**
 * Persistencia del carrito en localStorage.
 *
 * - Serialize a formato versioningado (version 1).
 * - Deserializa con validación estricta de estructura.
 * - Recalcula totalItems y totalPrice al restaurar.
 * - Maneja datos corruptos (elimina la entrada y devuelve null).
 * - Maneja formatos de versión futura (rechaza versiones desconocidas).
 * - SSR-safe: verifica disponibilidad de localStorage antes de acceder.
 */
import type { CartItem, CartState } from '@/types/cart';
import type { Money, CurrencyCode } from '@/types/pricing';
import { calculateTotal, calculateTotalItems, createInitialCartState } from '@/utils/cart/cartUtils';

export const CART_STORAGE_KEY = 'ecommerce-cart';
export const CART_FORMAT_VERSION = 1;

interface SerializedMoney {
  amount: number;
  currency: string;
}

interface SerializedProductImage {
  url: string;
  alt: string;
  key: string;
}

interface SerializedCartItem {
  productId: string;
  name: string;
  price: SerializedMoney;
  quantity: number;
  image: SerializedProductImage;
  maxStock: number;
}

interface SerializedCartState {
  version: number;
  state: {
    items: SerializedCartItem[];
    discount: SerializedMoney;
    totalItems: number;
    totalPrice: SerializedMoney;
    lastUpdated: string;
  };
}

const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = ['USD', 'MXN', 'EUR', 'GBP', 'CAD'];

function isAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function isMoney(obj: unknown): obj is Money {
  if (typeof obj !== 'object' || obj === null) return false;
  const m = obj as Record<string, unknown>;
  return (
    typeof m.amount === 'number' &&
    typeof m.currency === 'string' &&
    SUPPORTED_CURRENCIES.includes(m.currency as CurrencyCode)
  );
}

function isProductImage(obj: unknown): obj is { url: string; alt: string; key: string } {
  if (typeof obj !== 'object' || obj === null) return false;
  const i = obj as Record<string, unknown>;
  return typeof i.url === 'string' && typeof i.alt === 'string' && typeof i.key === 'string';
}

function isCartItem(obj: unknown): obj is CartItem {
  if (typeof obj !== 'object' || obj === null) return false;
  const i = obj as Record<string, unknown>;
  return (
    typeof i.productId === 'string' &&
    typeof i.name === 'string' &&
    isMoney(i.price) &&
    typeof i.quantity === 'number' &&
    i.quantity > 0 &&
    isProductImage(i.image) &&
    typeof i.maxStock === 'number' &&
    i.maxStock > 0
  );
}

export function saveCartToStorage(state: CartState): void {
  if (!isAvailable()) return;

  const serialized: SerializedCartState = {
    version: CART_FORMAT_VERSION,
    state: {
      items: state.items as CartItem[],
      discount: state.discount,
      totalItems: state.totalItems,
      totalPrice: state.totalPrice,
      lastUpdated: state.lastUpdated.toISOString(),
    },
  };

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // QuotaExceededError u otros errores de localStorage — silenciosos
  }
}

export function loadCartFromStorage(): CartState | null {
  if (!isAvailable()) return null;

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as unknown;

    if (typeof data !== 'object' || data === null) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return null;
    }

    const obj = data as Record<string, unknown>;

    if (obj.version !== CART_FORMAT_VERSION) {
      // Versión desconocida/futura: descartar para evitar datos inválidos
      localStorage.removeItem(CART_STORAGE_KEY);
      return null;
    }

    const stateData = obj.state;
    if (typeof stateData !== 'object' || stateData === null) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return null;
    }

    const s = stateData as Record<string, unknown>;

    if (
      !Array.isArray(s.items) ||
      !isMoney(s.discount) ||
      typeof s.totalItems !== 'number' ||
      !isMoney(s.totalPrice) ||
      typeof s.lastUpdated !== 'string'
    ) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return null;
    }

    // Filtrar artículos inválidos individualmente en lugar de rechazar todo
    const items: CartItem[] = s.items.filter(isCartItem);
    const discount = s.discount as Money;
    const lastUpdated = new Date(s.lastUpdated);

    // Recalcular totales derivados
    const totals = calculateTotal(items, discount);

    return {
      items,
      discount,
      totalItems: calculateTotalItems(items),
      totalPrice: totals.total,
      lastUpdated,
    };
  } catch {
    // JSON.parse corrupto u otro error: limpiar
    localStorage.removeItem(CART_STORAGE_KEY);
    return null;
  }
}

export function clearCartFromStorage(): void {
  if (!isAvailable()) return;
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function createInitialCartStateSafe(): CartState {
  return createInitialCartState();
}
