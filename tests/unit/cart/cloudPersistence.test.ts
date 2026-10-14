import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cartStateFixture } from '@/test/fixtures';
import { createInitialCartState } from '@/utils/cart/cartUtils';

const mocks = vi.hoisted(() => ({
  doc: vi.fn((_db: unknown, collection: string, userId: string) => ({ collection, userId })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getFirebaseDb: vi.fn(() => ({ name: 'test-db' })),
}));

vi.mock('firebase/firestore', () => ({
  doc: mocks.doc,
  getDoc: mocks.getDoc,
  setDoc: mocks.setDoc,
  deleteDoc: mocks.deleteDoc,
}));

vi.mock('@/infrastructure/firebase/config', () => ({
  getFirebaseDb: mocks.getFirebaseDb,
}));

import { loadCartFromCloud, saveCartToCloud } from '@/store/cart/cloudPersistence';

describe('cloud cart persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDoc.mockResolvedValue({ exists: () => false, data: () => undefined });
    mocks.setDoc.mockResolvedValue(undefined);
    mocks.deleteDoc.mockResolvedValue(undefined);
  });

  it('returns null when a user has no saved cart', async () => {
    await expect(loadCartFromCloud('customer-1')).resolves.toBeNull();
    expect(mocks.doc).toHaveBeenCalledWith({ name: 'test-db' }, 'carts', 'customer-1');
  });

  it('hydrates valid items and recalculates derived totals instead of trusting stored totals', async () => {
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        version: 1,
        items: cartStateFixture.items,
        discount: cartStateFixture.discount,
        totalItems: 999,
        totalPrice: { amount: 1, currency: 'USD' },
        lastUpdated: cartStateFixture.lastUpdated.toISOString(),
      }),
    });

    const restored = await loadCartFromCloud('customer-1');

    expect(restored?.totalItems).toBe(3);
    expect(restored?.totalPrice.amount).toBe(cartStateFixture.totalPrice.amount);
    expect(restored?.items).toHaveLength(2);
  });

  it('rejects unknown document versions', async () => {
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ version: 99, items: [], discount: { amount: 0, currency: 'USD' } }),
    });

    await expect(loadCartFromCloud('customer-1')).resolves.toBeNull();
  });

  it('writes a versioned per-user document', async () => {
    await saveCartToCloud('customer-1', cartStateFixture);

    expect(mocks.setDoc).toHaveBeenCalledWith(
      { collection: 'carts', userId: 'customer-1' },
      expect.objectContaining({
        version: 1,
        items: cartStateFixture.items,
        discount: cartStateFixture.discount,
        lastUpdated: cartStateFixture.lastUpdated.toISOString(),
      }),
    );
  });

  it('deletes the cloud document when the cart is cleared', async () => {
    await saveCartToCloud('customer-1', createInitialCartState());

    expect(mocks.deleteDoc).toHaveBeenCalledWith({ collection: 'carts', userId: 'customer-1' });
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });
});
