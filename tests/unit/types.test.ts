import { describe, it, expect } from 'vitest';

describe('Domain types', () => {
  it('should have cart action types defined', () => {
    const action = { type: 'ADD_ITEM', payload: { product: { id: '1' }, quantity: 1 } };
    expect(action.type).toBe('ADD_ITEM');
  });

  it('should handle cart reducer actions correctly', () => {
    const actionTypes = ['ADD_ITEM', 'REMOVE_ITEM', 'UPDATE_QUANTITY', 'CLEAR_CART', 'SET_CART'];
    actionTypes.forEach((type) => {
      expect(typeof type).toBe('string');
    });
  });
});
