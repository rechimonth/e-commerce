import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ordersService } from '@/services/ordersService';

const mocks = vi.hoisted(() => ({
  getCurrentUserIdToken: vi.fn(),
  getUserOrders: vi.fn(),
  getAllOrders: vi.fn(),
  getOrder: vi.fn(),
  updateOrderTracking: vi.fn(),
  addOrderAttachment: vi.fn(),
  removeOrderAttachment: vi.fn(),
}));

vi.mock('@/infrastructure/firebase/auth', () => ({
  getCurrentUserIdToken: mocks.getCurrentUserIdToken,
}));

vi.mock('@/infrastructure/firebase/firestore', () => ({
  getUserOrders: mocks.getUserOrders,
  getAllOrders: mocks.getAllOrders,
  getOrder: mocks.getOrder,
  updateOrderTracking: mocks.updateOrderTracking,
  addOrderAttachment: mocks.addOrderAttachment,
  removeOrderAttachment: mocks.removeOrderAttachment,
}));

vi.mock('@/infrastructure/firebase/config', () => {
  class FirebaseInfraError extends Error {
    constructor(readonly code: string, message: string) {
      super(message);
      this.name = 'FirebaseInfraError';
    }
  }
  return {
    FirebaseInfraError,
    firebaseTryCatch: async (fn: () => Promise<unknown>) => fn(),
  };
});

describe('ordersService.updateOrderStatus', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    mocks.getCurrentUserIdToken.mockResolvedValue('firebase-id-token');
    mocks.getOrder.mockResolvedValue(null);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses PATCH and waits for API confirmation before refreshing the order', async () => {
    await ordersService.updateOrderStatus('order-123', 'processing');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/update-order-status',
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer firebase-id-token',
        },
        body: JSON.stringify({ orderId: 'order-123', status: 'processing' }),
      }),
    );
    expect(mocks.getOrder).toHaveBeenCalledWith('order-123');
  });
});
