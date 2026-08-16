/**
 * Pure cart utilities and reducer.
 *
 * All functions are pure — no React, no localStorage, no Firebase.
 * CartState.totalItems y totalPrice se recalculan después de cada mutación.
 *
 * Decisiones de diseño:
 * - UPDATE_QUANTITY con cantidad <= 0 elimina el artículo del carrito.
 * - ADD_ITEM y UPDATE_QUANTITY clamping la cantidad a maxStock.
 * - calculateTotal asume tax=0 y shipping=0 (políticas configurables en el futuro).
 * - El total nunca es negativo; se clampea a 0 cuando el descuento excede el subtotal.
 */
import { DEFAULT_CURRENCY, addMoney, moneyFromCents, multiplyMoney } from '@/types/pricing';
import type { CartAction, CartItem, CartState, CartTotals } from '@/types/cart';
import type { CurrencyCode, Money } from '@/types/pricing';
import type { Product } from '@/types/domain';

function zeroMoney(currency: CurrencyCode = DEFAULT_CURRENCY): Money {
  return moneyFromCents(0, currency);
}

function toCartItem(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    name: product.name,
    price: product.price,
    quantity: Math.min(quantity, product.stock),
    image: product.image,
    maxStock: product.stock,
  };
}

export function createInitialCartState(
  currency: CurrencyCode = DEFAULT_CURRENCY,
  now: Date = new Date(),
): CartState {
  const zero = zeroMoney(currency);
  return {
    items: [],
    discount: zero,
    totalItems: 0,
    totalPrice: zero,
    lastUpdated: now,
  };
}

export function calculateTotalItems(items: readonly CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function calculateTotal(items: readonly CartItem[], discount: Money): CartTotals {
  const currency = discount.currency;
  let subtotal = zeroMoney(currency);

  for (const item of items) {
    subtotal = addMoney(subtotal, multiplyMoney(item.price, item.quantity));
  }

  const totalAmount = Math.max(0, subtotal.amount - discount.amount);
  const total: Money = { amount: totalAmount, currency };

  return {
    subtotal,
    tax: zeroMoney(currency),
    shipping: zeroMoney(currency),
    discount,
    total,
  };
}

export function addItem(
  items: readonly CartItem[],
  product: Product,
  quantity: number,
): CartItem[] {
  if (quantity <= 0 || product.stock <= 0) {
    return [...items];
  }

  const existingIndex = items.findIndex((item) => item.productId === product.id);

  if (existingIndex >= 0) {
    const existing = items[existingIndex]!;
    const newQuantity = Math.min(existing.quantity + quantity, existing.maxStock);

    if (newQuantity === existing.quantity) {
      return [...items];
    }

    return items.map((item, i) =>
      i === existingIndex ? { ...item, quantity: newQuantity } : item,
    );
  }

  return [...items, toCartItem(product, quantity)];
}

export function removeItem(items: readonly CartItem[], productId: string): CartItem[] {
  if (!items.some((item) => item.productId === productId)) {
    return [...items];
  }
  return items.filter((item) => item.productId !== productId);
}

export function updateItemQuantity(
  items: readonly CartItem[],
  productId: string,
  quantity: number,
): CartItem[] {
  const existingIndex = items.findIndex((item) => item.productId === productId);

  if (existingIndex < 0) {
    return [...items];
  }

  if (quantity <= 0) {
    return items.filter((item) => item.productId !== productId);
  }

  const existing = items[existingIndex]!;
  const clampedQuantity = Math.min(quantity, existing.maxStock);

  if (clampedQuantity === existing.quantity) {
    return [...items];
  }

  return items.map((item, i) =>
    i === existingIndex ? { ...item, quantity: clampedQuantity } : item,
  );
}

function recalculateTotals(items: readonly CartItem[], discount: Money): Pick<
  CartState,
  'totalItems' | 'totalPrice'
> {
  const totals = calculateTotal(items, discount);
  return {
    totalItems: calculateTotalItems(items),
    totalPrice: totals.total,
  };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  const now = new Date();

  switch (action.type) {
    case 'ADD_ITEM': {
      const items = addItem(state.items, action.product, action.quantity);
      const totals = recalculateTotals(items, state.discount);
      return { ...state, items, ...totals, lastUpdated: now };
    }

    case 'REMOVE_ITEM': {
      const items = removeItem(state.items, action.productId);
      const totals = recalculateTotals(items, state.discount);
      return { ...state, items, ...totals, lastUpdated: now };
    }

    case 'UPDATE_QUANTITY': {
      const items = updateItemQuantity(state.items, action.productId, action.quantity);
      const totals = recalculateTotals(items, state.discount);
      return { ...state, items, ...totals, lastUpdated: now };
    }

    case 'APPLY_DISCOUNT': {
      const totals = recalculateTotals(state.items, action.discount);
      return {
        ...state,
        discount: action.discount,
        ...totals,
        lastUpdated: now,
      };
    }

    case 'REMOVE_DISCOUNT': {
      const zeroDiscount = zeroMoney(state.discount.currency);
      const totals = recalculateTotals(state.items, zeroDiscount);
      return {
        ...state,
        discount: zeroDiscount,
        ...totals,
        lastUpdated: now,
      };
    }

    case 'CLEAR_CART': {
      return createInitialCartState(state.discount.currency, now);
    }

    case 'HYDRATE': {
      const hydrated = action.state;
      const totals = recalculateTotals(hydrated.items, hydrated.discount);
      return {
        items: hydrated.items,
        discount: hydrated.discount,
        ...totals,
        lastUpdated: hydrated.lastUpdated,
      };
    }

    default:
      return state;
  }
}
