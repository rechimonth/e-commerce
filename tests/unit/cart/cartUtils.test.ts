import { describe, it, expect } from 'vitest';
import {
  addItem,
  calculateTotal,
  calculateTotalItems,
  cartReducer,
  createInitialCartState,
  removeItem,
  updateItemQuantity,
} from '@/utils/cart';
import type { CartAction, CartItem, CartState } from '@/types/cart';
import { money, dollars } from '@/types/pricing';
import type { Product } from '@/types/domain';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Test Product',
    description: 'A test product',
    price: money(10.0),
    category: 'action-figures',
    image: { url: 'https://example.com/img.png', alt: 'Test', key: 'img-1' },
    stock: 10,
    rating: 4.5,
    reviewCount: 100,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin',
    ...overrides,
  };
}

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'p1',
    name: 'Test Product',
    price: money(10.0),
    quantity: 1,
    image: { url: 'https://example.com/img.png', alt: 'Test', key: 'img-1' },
    maxStock: 10,
    ...overrides,
  };
}

describe('createInitialCartState', () => {
  it('should create an empty cart with zero totals', () => {
    const state = createInitialCartState();
    expect(state.items).toHaveLength(0);
    expect(state.discount.amount).toBe(0);
    expect(state.totalItems).toBe(0);
    expect(state.totalPrice.amount).toBe(0);
    expect(state.discount.currency).toBe('USD');
    expect(state.totalPrice.currency).toBe('USD');
  });

  it('should accept a custom currency', () => {
    const state = createInitialCartState('EUR');
    expect(state.discount.currency).toBe('EUR');
    expect(state.totalPrice.currency).toBe('EUR');
  });

  it('should accept a custom date', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    const state = createInitialCartState('USD', now);
    expect(state.lastUpdated).toBe(now);
  });
});

describe('calculateTotalItems', () => {
  it('should return 0 for an empty cart', () => {
    expect(calculateTotalItems([])).toBe(0);
  });

  it('should return the quantity for a single item', () => {
    const items = [makeCartItem({ quantity: 3 })];
    expect(calculateTotalItems(items)).toBe(3);
  });

  it('should sum quantities across multiple items', () => {
    const items = [
      makeCartItem({ productId: 'p1', quantity: 2 }),
      makeCartItem({ productId: 'p2', quantity: 5 }),
      makeCartItem({ productId: 'p3', quantity: 1 }),
    ];
    expect(calculateTotalItems(items)).toBe(8);
  });
});

describe('calculateTotal', () => {
  it('should return zero totals for an empty cart with no discount', () => {
    const discount = money(0);
    const totals = calculateTotal([], discount);
    expect(totals.subtotal.amount).toBe(0);
    expect(totals.tax.amount).toBe(0);
    expect(totals.shipping.amount).toBe(0);
    expect(totals.discount.amount).toBe(0);
    expect(totals.total.amount).toBe(0);
  });

  it('should calculate subtotal for a single item', () => {
    const items = [makeCartItem({ price: money(10.0), quantity: 2 })];
    const totals = calculateTotal(items, money(0));
    expect(totals.subtotal.amount).toBe(2000);
    expect(totals.total.amount).toBe(2000);
  });

  it('should calculate subtotal for multiple items', () => {
    const items = [
      makeCartItem({ productId: 'p1', price: money(10.0), quantity: 2 }),
      makeCartItem({ productId: 'p2', price: money(5.5), quantity: 3 }),
    ];
    const totals = calculateTotal(items, money(0));
    expect(totals.subtotal.amount).toBe(2000 + 1650);
    expect(totals.total.amount).toBe(2000 + 1650);
  });

  it('should subtract discount from total', () => {
    const items = [makeCartItem({ price: money(100.0), quantity: 1 })];
    const totals = calculateTotal(items, money(20.0));
    expect(totals.subtotal.amount).toBe(10000);
    expect(totals.discount.amount).toBe(2000);
    expect(totals.total.amount).toBe(8000);
  });

  it('should clamp total to 0 when discount exceeds subtotal', () => {
    const items = [makeCartItem({ price: money(10.0), quantity: 1 })];
    const totals = calculateTotal(items, money(25.0));
    expect(totals.total.amount).toBe(0);
  });

  it('should default tax and shipping to zero', () => {
    const items = [makeCartItem({ price: money(50.0), quantity: 1 })];
    const totals = calculateTotal(items, money(0));
    expect(totals.tax.amount).toBe(0);
    expect(totals.shipping.amount).toBe(0);
  });
});

describe('addItem', () => {
  it('should add a new item to an empty cart', () => {
    const product = makeProduct({ id: 'p1', price: money(10.0) });
    const result = addItem([], product, 2);
    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe('p1');
    expect(result[0]?.quantity).toBe(2);
    expect(result[0]?.maxStock).toBe(10);
  });

  it('should merge quantity when adding an existing item', () => {
    const product = makeProduct({ id: 'p1', price: money(10.0) });
    const items = [makeCartItem({ productId: 'p1', quantity: 2 })];
    const result = addItem(items, product, 3);
    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe(5);
  });

  it('should clamp quantity to maxStock when exceeding stock', () => {
    const product = makeProduct({ id: 'p1', stock: 5, price: money(10.0) });
    const result = addItem([], product, 10);
    expect(result[0]?.quantity).toBe(5);
  });

  it('should clamp merged quantity to maxStock', () => {
    const product = makeProduct({ id: 'p1', stock: 8, price: money(10.0) });
    const items = [makeCartItem({ productId: 'p1', quantity: 7, maxStock: 8 })];
    const result = addItem(items, product, 5);
    expect(result[0]?.quantity).toBe(8);
  });

  it('should not add when quantity is zero or negative', () => {
    const product = makeProduct({ id: 'p1' });
    expect(addItem([], product, 0)).toHaveLength(0);
    expect(addItem([], product, -1)).toHaveLength(0);
  });

  it('should not add when product has no stock', () => {
    const product = makeProduct({ id: 'p1', stock: 0 });
    expect(addItem([], product, 5)).toHaveLength(0);
  });

  it('should not mutate the original array', () => {
    const product = makeProduct({ id: 'p1' });
    const original = [makeCartItem({ productId: 'p1', quantity: 2 })];
    addItem(original, product, 3);
    expect(original).toHaveLength(1);
    expect(original[0]?.quantity).toBe(2);
  });
});

describe('removeItem', () => {
  it('should remove an existing item by productId', () => {
    const items = [
      makeCartItem({ productId: 'p1', quantity: 2 }),
      makeCartItem({ productId: 'p2', quantity: 1 }),
    ];
    const result = removeItem(items, 'p1');
    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe('p2');
  });

  it('should return unchanged array when productId does not exist', () => {
    const items = [makeCartItem({ productId: 'p1' })];
    const result = removeItem(items, 'p999');
    expect(result).toHaveLength(1);
  });

  it('should handle removing from an empty cart', () => {
    expect(removeItem([], 'p1')).toHaveLength(0);
  });
});

describe('updateItemQuantity', () => {
  it('should update quantity for an existing item', () => {
    const items = [makeCartItem({ productId: 'p1', quantity: 2 })];
    const result = updateItemQuantity(items, 'p1', 5);
    expect(result[0]?.quantity).toBe(5);
  });

  it('should remove the item when quantity is zero', () => {
    const items = [
      makeCartItem({ productId: 'p1', quantity: 2 }),
      makeCartItem({ productId: 'p2', quantity: 1 }),
    ];
    const result = updateItemQuantity(items, 'p1', 0);
    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe('p2');
  });

  it('should remove the item when quantity is negative', () => {
    const items = [makeCartItem({ productId: 'p1', quantity: 3 })];
    const result = updateItemQuantity(items, 'p1', -1);
    expect(result).toHaveLength(0);
  });

  it('should clamp quantity to maxStock', () => {
    const items = [makeCartItem({ productId: 'p1', quantity: 1, maxStock: 5 })];
    const result = updateItemQuantity(items, 'p1', 10);
    expect(result[0]?.quantity).toBe(5);
  });

  it('should return unchanged array when productId does not exist', () => {
    const items = [makeCartItem({ productId: 'p1' })];
    const result = updateItemQuantity(items, 'p999', 5);
    expect(result).toHaveLength(1);
  });
});

describe('cartReducer', () => {
  const initial = createInitialCartState();

  it('should add an item on ADD_ITEM', () => {
    const product = makeProduct({ id: 'p1', price: money(10.0) });
    const action: CartAction = { type: 'ADD_ITEM', product, quantity: 2 };
    const state = cartReducer(initial, action);
    expect(state.items).toHaveLength(1);
    expect(state.totalItems).toBe(2);
    expect(state.totalPrice.amount).toBe(2000);
    expect(state.lastUpdated).toBeInstanceOf(Date);
  });

  it('should remove an item on REMOVE_ITEM', () => {
    const product = makeProduct({ id: 'p1', price: money(10.0) });
    const stateWithItem = cartReducer(initial, { type: 'ADD_ITEM', product, quantity: 3 });
    const state = cartReducer(stateWithItem, { type: 'REMOVE_ITEM', productId: 'p1' });
    expect(state.items).toHaveLength(0);
    expect(state.totalItems).toBe(0);
    expect(state.totalPrice.amount).toBe(0);
  });

  it('should update quantity on UPDATE_QUANTITY', () => {
    const product = makeProduct({ id: 'p1', price: money(10.0) });
    const stateWithItem = cartReducer(initial, { type: 'ADD_ITEM', product, quantity: 2 });
    const state = cartReducer(stateWithItem, {
      type: 'UPDATE_QUANTITY',
      productId: 'p1',
      quantity: 5,
    });
    expect(state.items[0]?.quantity).toBe(5);
    expect(state.totalItems).toBe(5);
    expect(state.totalPrice.amount).toBe(5000);
  });

  it('should remove item on UPDATE_QUANTITY with zero', () => {
    const product = makeProduct({ id: 'p1', price: money(10.0) });
    const stateWithItem = cartReducer(initial, { type: 'ADD_ITEM', product, quantity: 2 });
    const state = cartReducer(stateWithItem, {
      type: 'UPDATE_QUANTITY',
      productId: 'p1',
      quantity: 0,
    });
    expect(state.items).toHaveLength(0);
    expect(state.totalItems).toBe(0);
  });

  it('should apply discount on APPLY_DISCOUNT', () => {
    const product = makeProduct({ id: 'p1', price: money(100.0) });
    const stateWithItem = cartReducer(initial, { type: 'ADD_ITEM', product, quantity: 1 });
    const state = cartReducer(stateWithItem, {
      type: 'APPLY_DISCOUNT',
      discount: money(25.0),
    });
    expect(state.discount.amount).toBe(2500);
    expect(state.totalPrice.amount).toBe(7500);
  });

  it('should remove discount on REMOVE_DISCOUNT', () => {
    const product = makeProduct({ id: 'p1', price: money(100.0) });
    let state = cartReducer(initial, { type: 'ADD_ITEM', product, quantity: 1 });
    state = cartReducer(state, { type: 'APPLY_DISCOUNT', discount: money(25.0) });
    state = cartReducer(state, { type: 'REMOVE_DISCOUNT' });
    expect(state.discount.amount).toBe(0);
    expect(state.totalPrice.amount).toBe(10000);
  });

  it('should clear the cart on CLEAR_CART', () => {
    const product = makeProduct({ id: 'p1', price: money(10.0) });
    let state = cartReducer(initial, { type: 'ADD_ITEM', product, quantity: 3 });
    state = cartReducer(state, { type: 'CLEAR_CART' });
    expect(state.items).toHaveLength(0);
    expect(state.totalItems).toBe(0);
    expect(state.totalPrice.amount).toBe(0);
    expect(state.discount.amount).toBe(0);
  });

  it('should recalculate totals on HYDRATE', () => {
    const staleState: CartState = {
      items: [makeCartItem({ productId: 'p1', price: money(10.0), quantity: 3 })],
      discount: money(0),
      totalItems: 999,
      totalPrice: money(0),
      lastUpdated: new Date('2024-01-01'),
    };
    const state = cartReducer(initial, { type: 'HYDRATE', state: staleState });
    expect(state.totalItems).toBe(3);
    expect(state.totalPrice.amount).toBe(3000);
    expect(state.lastUpdated).toEqual(new Date('2024-01-01'));
  });

  it('should preserve immutability on each action', () => {
    const product = makeProduct({ id: 'p1', price: money(10.0) });
    const state1 = cartReducer(initial, { type: 'ADD_ITEM', product, quantity: 2 });
    const state2 = cartReducer(state1, { type: 'ADD_ITEM', product, quantity: 1 });
    expect(state1).not.toBe(state2);
    expect(state1.items).not.toBe(state2.items);
    expect(state2.items[0]?.quantity).toBe(3);
    expect(state1.items[0]?.quantity).toBe(2);
  });

  it('should handle multiple items with different prices', () => {
    const p1 = makeProduct({ id: 'p1', price: money(10.0) });
    const p2 = makeProduct({ id: 'p2', price: money(5.5) });
    let state = cartReducer(initial, { type: 'ADD_ITEM', product: p1, quantity: 2 });
    state = cartReducer(state, { type: 'ADD_ITEM', product: p2, quantity: 3 });
    expect(state.totalItems).toBe(5);
    expect(state.totalPrice.amount).toBe(2000 + 1650);
  });

  it('should clamp add quantity to maxStock in reducer', () => {
    const product = makeProduct({ id: 'p1', stock: 5, price: money(10.0) });
    const state = cartReducer(initial, { type: 'ADD_ITEM', product, quantity: 10 });
    expect(state.items[0]?.quantity).toBe(5);
    expect(state.totalItems).toBe(5);
  });

  it('should return same state reference for unknown action', () => {
    const state = cartReducer(initial, { type: 'HYDRATE', state: initial } as unknown as CartAction);
    const unknownAction = { type: 'UNKNOWN_ACTION' } as unknown as CartAction;
    expect(cartReducer(state, unknownAction)).toBe(state);
  });
});

describe('cartReducer integration', () => {
  it('should support full add/update/remove flow with totals', () => {
    const p1 = makeProduct({ id: 'p1', price: money(20.0), stock: 50 });
    const p2 = makeProduct({ id: 'p2', price: money(15.0), stock: 99 });
    let state = createInitialCartState();

    state = cartReducer(state, { type: 'ADD_ITEM', product: p1, quantity: 3 });
    expect(state.totalItems).toBe(3);
    expect(dollars(state.totalPrice.amount)).toBe(60.0);

    state = cartReducer(state, { type: 'ADD_ITEM', product: p2, quantity: 2 });
    expect(state.totalItems).toBe(5);
    expect(dollars(state.totalPrice.amount)).toBe(90.0);

    state = cartReducer(state, { type: 'UPDATE_QUANTITY', productId: 'p1', quantity: 5 });
    expect(state.totalItems).toBe(7);
    expect(dollars(state.totalPrice.amount)).toBe(130.0);

    state = cartReducer(state, { type: 'APPLY_DISCOUNT', discount: money(10.0) });
    expect(dollars(state.totalPrice.amount)).toBe(120.0);
    expect(state.discount.amount).toBe(1000);

    state = cartReducer(state, { type: 'REMOVE_DISCOUNT' });
    expect(dollars(state.totalPrice.amount)).toBe(130.0);

    state = cartReducer(state, { type: 'REMOVE_ITEM', productId: 'p2' });
    expect(state.totalItems).toBe(5);
    expect(dollars(state.totalPrice.amount)).toBe(100.0);
  });
});
