import { describe, it, expect } from 'vitest';
import { canTransition, VALID_ORDER_TRANSITIONS, type OrderStatus } from '@/types/order';
import type { Product } from '@/types/domain';
import {
  money,
  addMoney,
  subtractMoney,
  multiplyMoney,
  dollars,
  cents,
  formatMoney,
} from '@/types/pricing';
import { createPagination } from '@/types/api';
import { isAsyncSuccess, isAsyncError, isAsyncLoading, isAsyncIdle } from '@/types/ui';
import type { AsyncState, ProductCardVariant } from '@/types';

describe('Order status transitions', () => {
  it('should allow pending -> processing', () => {
    expect(canTransition('pending', 'processing')).toBe(true);
  });

  it('should allow pending -> cancelled', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true);
  });

  it('should allow processing -> completed', () => {
    expect(canTransition('processing', 'completed')).toBe(true);
  });

  it('should allow processing -> cancelled', () => {
    expect(canTransition('processing', 'cancelled')).toBe(true);
  });

  it('should NOT allow pending -> completed (must go through processing)', () => {
    expect(canTransition('pending', 'completed')).toBe(false);
  });

  it('should NOT allow completed -> cancelled', () => {
    expect(canTransition('completed', 'cancelled')).toBe(false);
  });

  it('should NOT allow completed -> processing', () => {
    expect(canTransition('completed', 'processing')).toBe(false);
  });

  it('should NOT allow cancelled -> any', () => {
    expect(canTransition('cancelled', 'pending')).toBe(false);
    expect(canTransition('cancelled', 'processing')).toBe(false);
    expect(canTransition('cancelled', 'completed')).toBe(false);
  });

  it('should only allow valid statuses as keys', () => {
    const keys = Object.keys(VALID_ORDER_TRANSITIONS) as OrderStatus[];
    expect(keys).toHaveLength(4);
    expect(keys).toContain('pending');
    expect(keys).toContain('processing');
    expect(keys).toContain('completed');
    expect(keys).toContain('cancelled');
  });
});

describe('Money utilities', () => {
  it('should convert dollars to cents correctly', () => {
    expect(cents(99.99)).toBe(9999);
    expect(cents(100)).toBe(10000);
    expect(cents(0.01)).toBe(1);
  });

  it('should convert cents to dollars correctly', () => {
    expect(dollars(9999)).toBe(99.99);
    expect(dollars(10000)).toBe(100);
    expect(dollars(1)).toBe(0.01);
  });

  it('should create money from dollars', () => {
    const m = money(49.99);
    expect(m.amount).toBe(4999);
    expect(m.currency).toBe('USD');
  });

  it('should add money correctly', () => {
    const a = money(10.5);
    const b = money(5.25);
    const result = addMoney(a, b);
    expect(result.amount).toBe(1575);
  });

  it('should subtract money correctly', () => {
    const a = money(10.5);
    const b = money(5.25);
    const result = subtractMoney(a, b);
    expect(result.amount).toBe(525);
  });

  it('should multiply money correctly', () => {
    const m = money(10.0);
    const result = multiplyMoney(m, 3);
    expect(result.amount).toBe(3000);
  });

  it('should throw on mixed currency add', () => {
    const a = money(10, 'USD');
    const b = money(5, 'EUR');
    expect(() => addMoney(a, b)).toThrow('Cannot add money');
  });

  it('should throw on negative multiplier', () => {
    expect(() => multiplyMoney(money(10), -1)).toThrow('non-negative');
  });

  it('should format money as currency string', () => {
    const m = money(99.99, 'USD');
    const formatted = formatMoney(m);
    expect(formatted).toContain('99.99');
  });
});

describe('Pagination', () => {
  it('should create correct pagination for first page', () => {
    const p = createPagination(1, 10, 35);
    expect(p.page).toBe(1);
    expect(p.limit).toBe(10);
    expect(p.total).toBe(35);
    expect(p.hasNext).toBe(true);
    expect(p.hasPrev).toBe(false);
  });

  it('should create correct pagination for middle page', () => {
    const p = createPagination(2, 10, 35);
    expect(p.page).toBe(2);
    expect(p.hasNext).toBe(true);
    expect(p.hasPrev).toBe(true);
  });

  it('should create correct pagination for last page', () => {
    const p = createPagination(4, 10, 35);
    expect(p.page).toBe(4);
    expect(p.hasNext).toBe(false);
    expect(p.hasPrev).toBe(true);
  });

  it('should clamp page number below 1', () => {
    const p = createPagination(-5, 10, 35);
    expect(p.page).toBe(1);
  });

  it('should clamp page number above total pages', () => {
    const p = createPagination(100, 10, 35);
    expect(p.page).toBe(4);
  });
});

describe('AsyncState type guards', () => {
  it('isAsyncIdle returns true for idle state', () => {
    const state: AsyncState<null> = { status: 'idle', data: null, error: null };
    expect(isAsyncIdle(state)).toBe(true);
    expect(isAsyncLoading(state)).toBe(false);
    expect(isAsyncError(state)).toBe(false);
    expect(isAsyncSuccess(state)).toBe(false);
  });

  it('isAsyncLoading returns true for loading state', () => {
    const state: AsyncState<string> = { status: 'loading', data: null, error: null };
    expect(isAsyncLoading(state)).toBe(true);
    expect(isAsyncIdle(state)).toBe(false);
  });

  it('isAsyncSuccess returns true for success state', () => {
    const state: AsyncState<string> = { status: 'success', data: 'hello', error: null };
    expect(isAsyncSuccess(state)).toBe(true);
    expect(isAsyncError(state)).toBe(false);
  });

  it('isAsyncError returns true for error state', () => {
    const state: AsyncState<null> = {
      status: 'error',
      data: null,
      error: { code: 'NOT_FOUND', message: 'Not found' },
    };
    expect(isAsyncError(state)).toBe(true);
    expect(isAsyncSuccess(state)).toBe(false);
  });

  it('type guard narrows data type correctly', () => {
    const state: AsyncState<{ id: string }> = {
      status: 'success',
      data: { id: '123' },
      error: null,
    };
    if (isAsyncSuccess(state)) {
      expect(state.data.id).toBe('123');
    }
  });
});

describe('Domain type compilation', () => {
  it('Product type has required shape', () => {
    const product: Product = {
      id: 'p1',
      name: 'Test Product',
      description: 'A test product',
      price: money(99.99),
      category: 'electronics',
      image: { url: 'https://example.com/img.png', alt: 'Test', key: 'img-1' },
      stock: 10,
      rating: 4.5,
      reviewCount: 100,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin-uid',
    };
    expect(product.id).toBe('p1');
    expect(product.price.amount).toBe(9999);
  });

  it('ProductCardVariant accepts all valid variants', () => {
    const v1: ProductCardVariant = 'default';
    const v2: ProductCardVariant = 'compact';
    const v3: ProductCardVariant = 'featured';
    expect(v1).toBe('default');
    expect(v2).toBe('compact');
    expect(v3).toBe('featured');
  });
});
