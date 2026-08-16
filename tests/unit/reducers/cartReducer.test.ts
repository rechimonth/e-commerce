import { describe, it, expect, beforeEach } from 'vitest';
import { cartReducer, createInitialCartState } from '@/utils/cart/cartUtils';
import type { CartState, CartAction } from '@/types/cart';
import type { Product } from '@/types/domain';
import { money, moneyFromCents } from '@/types/pricing';

function productFixture(): Product {
  return {
    id: 'prod-1',
    name: 'Test Product',
    description: 'Test description',
    price: money(1000),
    category: 'electronics',
    image: { url: 'https://example.com/img.png', alt: 'Test', key: 'img-1' },
    stock: 10,
    rating: 4.5,
    reviewCount: 100,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
  };
}

function buildAction(type: CartAction['type'], payload: Record<string, unknown> = {}): CartAction {
  switch (type) {
    case 'ADD_ITEM':
      return { type, product: payload.product as Product, quantity: payload.quantity as number };
    case 'REMOVE_ITEM':
      return { type, productId: payload.productId as string };
    case 'UPDATE_QUANTITY':
      return { type, productId: payload.productId as string, quantity: payload.quantity as number };
    case 'APPLY_DISCOUNT':
      return { type, discount: payload.discount as { amount: number; currency: string } };
    case 'REMOVE_DISCOUNT':
      return { type: 'REMOVE_DISCOUNT' };
    case 'CLEAR_CART':
      return { type: 'CLEAR_CART' };
    case 'HYDRATE':
      return { type: 'HYDRATE', state: payload.state as CartState };
    default:
      return { type: 'CLEAR_CART' } as CartAction;
  }
}

describe('cartReducer', () => {
  let state: CartState;

  beforeEach(() => {
    state = createInitialCartState('USD');
  });

  it('returns initial state', () => {
    expect(state.items).toEqual([]);
    expect(state.totalItems).toBe(0);
    expect(state.totalPrice.amount).toBe(0);
  });

  describe('ADD_ITEM', () => {
    it('adds a new item', () => {
      const product = productFixture();
      const next = cartReducer(state, buildAction('ADD_ITEM', { product, quantity: 1 }));
      expect(next.items).toHaveLength(1);
      expect(next.items[0]!.productId).toBe('prod-1');
      expect(next.totalItems).toBe(1);
    });

    it('increases quantity for existing item', () => {
      const product = productFixture();
      const afterFirst = cartReducer(state, buildAction('ADD_ITEM', { product, quantity: 1 }));
      const afterSecond = cartReducer(afterFirst, buildAction('ADD_ITEM', { product, quantity: 2 }));
      expect(afterSecond.items).toHaveLength(1);
      expect(afterSecond.items[0]!.quantity).toBe(3);
    });

    it('clamps quantity to stock', () => {
      const product = productFixture();
      const next = cartReducer(state, buildAction('ADD_ITEM', { product, quantity: 20 }));
      expect(next.items[0]!.quantity).toBe(10);
    });

    it('ignores non-positive quantity', () => {
      const product = productFixture();
      const next = cartReducer(state, buildAction('ADD_ITEM', { product, quantity: 0 }));
      expect(next.items).toHaveLength(0);
    });
  });

  describe('REMOVE_ITEM', () => {
    it('removes existing item', () => {
      const product = productFixture();
      const withItem = cartReducer(state, buildAction('ADD_ITEM', { product, quantity: 1 }));
      const next = cartReducer(withItem, buildAction('REMOVE_ITEM', { productId: 'prod-1' }));
      expect(next.items).toHaveLength(0);
    });

    it('ignores removing non-existing item', () => {
      const next = cartReducer(state, buildAction('REMOVE_ITEM', { productId: 'unknown' }));
      expect(next.items).toHaveLength(0);
    });
  });

  describe('UPDATE_QUANTITY', () => {
    it('updates quantity for existing item', () => {
      const product = productFixture();
      const withItem = cartReducer(state, buildAction('ADD_ITEM', { product, quantity: 1 }));
      const next = cartReducer(withItem, buildAction('UPDATE_QUANTITY', { productId: 'prod-1', quantity: 5 }));
      expect(next.items[0]!.quantity).toBe(5);
    });

    it('removes item when quantity <= 0', () => {
      const product = productFixture();
      const withItem = cartReducer(state, buildAction('ADD_ITEM', { product, quantity: 1 }));
      const next = cartReducer(withItem, buildAction('UPDATE_QUANTITY', { productId: 'prod-1', quantity: 0 }));
      expect(next.items).toHaveLength(0);
    });

    it('clamps quantity to stock', () => {
      const product = productFixture();
      const withItem = cartReducer(state, buildAction('ADD_ITEM', { product, quantity: 1 }));
      const next = cartReducer(withItem, buildAction('UPDATE_QUANTITY', { productId: 'prod-1', quantity: 20 }));
      expect(next.items[0]!.quantity).toBe(10);
    });
  });

  describe('APPLY_DISCOUNT', () => {
    it('applies discount', () => {
      const product = productFixture();
      const withItem = cartReducer(state, buildAction('ADD_ITEM', { product, quantity: 1 }));
      const discount = moneyFromCents(200);
      const next = cartReducer(withItem, buildAction('APPLY_DISCOUNT', { discount }));
      expect(next.discount.amount).toBe(200);
    });
  });

  describe('REMOVE_DISCOUNT', () => {
    it('removes discount', () => {
      const product = productFixture();
      const withItem = cartReducer(state, buildAction('ADD_ITEM', { product, quantity: 1 }));
      const withDiscount = cartReducer(withItem, buildAction('APPLY_DISCOUNT', { discount: moneyFromCents(200) }));
      const next = cartReducer(withDiscount, buildAction('REMOVE_DISCOUNT'));
      expect(next.discount.amount).toBe(0);
    });
  });

  describe('CLEAR_CART', () => {
    it('clears all items', () => {
      const product = productFixture();
      const withItem = cartReducer(state, buildAction('ADD_ITEM', { product, quantity: 1 }));
      const next = cartReducer(withItem, buildAction('CLEAR_CART'));
      expect(next.items).toHaveLength(0);
      expect(next.totalItems).toBe(0);
    });
  });

  describe('HYDRATE', () => {
    it('hydrates state from saved state', () => {
      const savedState: CartState = {
        items: [
          {
            productId: 'prod-hydrated',
            name: 'Hydrated Product',
            price: money(500),
            quantity: 2,
            image: { url: 'https://example.com/h.png', alt: 'H', key: 'h' },
            maxStock: 5,
          },
        ],
        discount: money(0),
        totalItems: 2,
        totalPrice: money(1000),
        lastUpdated: new Date('2024-01-01'),
      };
      const next = cartReducer(state, buildAction('HYDRATE', { state: savedState }));
      expect(next.items).toHaveLength(1);
      expect(next.items[0]!.productId).toBe('prod-hydrated');
    });
  });

  it('returns current state for unknown action', () => {
    const next = cartReducer(state, { type: 'UNKNOWN' } as CartAction);
    expect(next).toBe(state);
  });
});
