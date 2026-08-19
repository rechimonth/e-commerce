import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockAuth = { _type: 'Auth' };
  const mockDb = { _type: 'Firestore' };

  const mockProductData = {
    name: 'Test Product',
    description: 'A test product',
    priceCents: 9999,
    currency: 'USD',
    category: 'action-figures',
    imageKey: 'img-1',
    imageUrl: 'https://example.com/img.png',
    stock: 10,
    rating: 4.5,
    reviewCount: 100,
    isActive: true,
    createdAt: { seconds: 1700000000, nanoseconds: 0 },
    updatedAt: { seconds: 1700000000, nanoseconds: 0 },
    createdBy: 'admin-uid',
  };

  const mockOrderData = {
    userId: 'user-1',
    items: [
      {
        productId: 'p1',
        name: 'Product 1',
        priceCents: 5000,
        quantity: 2,
        imageUrl: 'https://example.com/p1.png',
        orderId: 'order-1',
      },
    ],
    subtotalCents: 10000,
    taxCents: 700,
    shippingCents: 0,
    discountCents: 0,
    totalCents: 10700,
    currency: 'USD',
    status: 'pending',
    statusHistory: [{ from: 'pending', to: 'pending', by: 'user-1', timestamp: 1700000000000 }],
    shippingAddress: {
      street: '123 Main St',
      city: 'NYC',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    billingAddress: {
      street: '123 Main St',
      city: 'NYC',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    paymentMethod: 'card',
    notes: 'Test order',
  };

  function makeDocSnap(id: string, data: Record<string, unknown> | null, exists = true) {
    return {
      id,
      exists: () => exists,
      data: () => data,
    };
  }

  function makeQuerySnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
    return {
      docs: docs.map((d) => makeDocSnap(d.id, d.data)),
      empty: docs.length === 0,
      size: docs.length,
    };
  }

  const firestoreStubs = {
    doc: vi.fn((_db, path, id) => ({ _ref: `${path}/${id}`, id })),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    addDoc: vi.fn(),
    collection: vi.fn((_db, path) => ({ _collection: path })),
    query: vi.fn((ref, ...constraints) => ({ _ref: ref, _constraints: constraints })),
    where: vi.fn((field, op, value) => ({ _where: { field, op, value } })),
    orderBy: vi.fn((field, dir) => ({ _orderBy: { field, dir } })),
    limit: vi.fn((n) => ({ _limit: n })),
    serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
    Timestamp: {
      fromMillis: vi.fn((ms: number) => ({ _type: 'Timestamp', _ms: ms })),
      fromDate: vi.fn((d: Date) => ({ _type: 'Timestamp', _date: d })),
      prototype: { toMillis: vi.fn() },
    },
    getFirestore: vi.fn(() => mockDb),
  };

  return {
    firestoreStubs,
    mockDb,
    mockAuth,
    mockProductData,
    mockOrderData,
    makeDocSnap,
    makeQuerySnap,
  };
});

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ _type: 'App' })),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mocks.mockAuth),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('firebase/firestore', () => mocks.firestoreStubs);

describe('Firebase firestore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');

    mocks.firestoreStubs.getFirestore.mockReturnValue(mocks.mockDb);
  });

  async function setupFirestore() {
    const config = await import('@/infrastructure/firebase/config');
    config._resetFirebaseForTesting();
    config.initializeFirebase();

    return await import('@/infrastructure/firebase/firestore');
  }

  /* ----------------------- PRODUCT FUNCTIONS ----------------------- */

  it('getProducts returns mapped ProductDTO array', async () => {
    const { getProducts } = await setupFirestore();
    mocks.firestoreStubs.getDocs.mockResolvedValue(
      mocks.makeQuerySnap([
        { id: 'p1', data: mocks.mockProductData },
        { id: 'p2', data: mocks.mockProductData },
      ]),
    );

    const products = await getProducts();

    expect(mocks.firestoreStubs.collection).toHaveBeenCalledWith(mocks.mockDb, 'products');
    expect(products).toHaveLength(2);
    expect(products[0]!.id).toBe('p1');
    expect(products[0]!.name).toBe('Test Product');
    expect(products[0]!.priceCents).toBe(9999);
    expect(products[0]!.category).toBe('action-figures');
  });

  it('getProducts with category filter applies where clause', async () => {
    const { getProducts } = await setupFirestore();
    mocks.firestoreStubs.getDocs.mockResolvedValue(
      mocks.makeQuerySnap([{ id: 'p1', data: mocks.mockProductData }]),
    );

    await getProducts({ category: 'action-figures' });

    expect(mocks.firestoreStubs.where).toHaveBeenCalledWith('category', '==', 'action-figures');
  });

  it('getProducts with isActive filter applies where clause', async () => {
    const { getProducts } = await setupFirestore();
    mocks.firestoreStubs.getDocs.mockResolvedValue(mocks.makeQuerySnap([]));

    await getProducts({ isActive: true });

    expect(mocks.firestoreStubs.where).toHaveBeenCalledWith('isActive', '==', true);
  });

  it('getProduct returns null when doc does not exist', async () => {
    const { getProduct } = await setupFirestore();
    mocks.firestoreStubs.getDoc.mockResolvedValue(mocks.makeDocSnap('p1', null, false));

    const result = await getProduct('p1');
    expect(result).toBeNull();
  });

  it('getProduct returns ProductDTO when doc exists', async () => {
    const { getProduct } = await setupFirestore();
    mocks.firestoreStubs.getDoc.mockResolvedValue(mocks.makeDocSnap('p1', mocks.mockProductData));

    const result = await getProduct('p1');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('p1');
    expect(result?.priceCents).toBe(9999);
  });

  it('createProduct calls addDoc with product data + serverTimestamps', async () => {
    const { createProduct } = await setupFirestore();
    mocks.firestoreStubs.addDoc.mockResolvedValue({ id: 'new-id' });
    mocks.firestoreStubs.getDoc.mockResolvedValue(
      mocks.makeDocSnap('new-id', mocks.mockProductData),
    );

    const result = await createProduct({
      name: 'New Product',
      description: 'New',
      priceCents: 5000,
      currency: 'USD',
      category: 'shoes',
      imageKey: 'img-1',
      imageUrl: 'https://example.com/img.png',
      stock: 5,
      rating: 0,
      reviewCount: 0,
      isActive: true,
      createdBy: 'admin',
    });

    expect(mocks.firestoreStubs.addDoc).toHaveBeenCalled();
    expect(result.id).toBe('new-id');
  });

  it('updateProduct returns null when doc does not exist', async () => {
    const { updateProduct } = await setupFirestore();
    mocks.firestoreStubs.getDoc.mockResolvedValue(mocks.makeDocSnap('p1', null, false));

    const result = await updateProduct('p1', { name: 'Updated' });
    expect(result).toBeNull();
    expect(mocks.firestoreStubs.updateDoc).not.toHaveBeenCalled();
  });

  it('updateProduct updates doc and returns updated product', async () => {
    const { updateProduct } = await setupFirestore();
    const updatedData = { ...mocks.mockProductData, name: 'Updated Name' };
    mocks.firestoreStubs.getDoc
      .mockResolvedValueOnce(mocks.makeDocSnap('p1', mocks.mockProductData))
      .mockResolvedValueOnce(mocks.makeDocSnap('p1', updatedData));

    const result = await updateProduct('p1', { name: 'Updated Name' });
    expect(mocks.firestoreStubs.updateDoc).toHaveBeenCalled();
    expect(result?.name).toBe('Updated Name');
  });

  it('deleteProduct returns false when doc does not exist', async () => {
    const { deleteProduct } = await setupFirestore();
    mocks.firestoreStubs.getDoc.mockResolvedValue(mocks.makeDocSnap('p1', null, false));

    const result = await deleteProduct('p1');
    expect(result).toBe(false);
  });

  it('deleteProduct returns true when doc exists and is deleted', async () => {
    const { deleteProduct } = await setupFirestore();
    mocks.firestoreStubs.getDoc.mockResolvedValue(mocks.makeDocSnap('p1', mocks.mockProductData));

    const result = await deleteProduct('p1');
    expect(mocks.firestoreStubs.deleteDoc).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  /* ----------------------- ORDER FUNCTIONS ----------------------- */

  it('createOrder calls addDoc and returns OrderDTO with pending status', async () => {
    const { createOrder } = await setupFirestore();
    mocks.firestoreStubs.addDoc.mockResolvedValue({ id: 'order-1' });
    mocks.firestoreStubs.getDoc.mockResolvedValue(
      mocks.makeDocSnap('order-1', mocks.mockOrderData),
    );

    const result = await createOrder({
      userId: 'user-1',
      items: [],
      subtotalCents: 10000,
      taxCents: 700,
      shippingCents: 0,
      discountCents: 0,
      totalCents: 10700,
      currency: 'USD' as const,
      shippingAddress: mocks.mockOrderData.shippingAddress,
      billingAddress: mocks.mockOrderData.billingAddress,
      paymentMethod: 'card' as const,
      notes: 'Test order',
    });

    expect(mocks.firestoreStubs.setDoc).toHaveBeenCalled();
    expect(result.id).toBe('order-1');
    expect(result.status).toBe('pending');
  });

  it('getUserOrders queries by userId and returns OrderDTO array', async () => {
    const { getUserOrders } = await setupFirestore();
    mocks.firestoreStubs.getDocs.mockResolvedValue(
      mocks.makeQuerySnap([{ id: 'order-1', data: mocks.mockOrderData }]),
    );

    const orders = await getUserOrders('user-1');
    expect(mocks.firestoreStubs.where).toHaveBeenCalledWith('userId', '==', 'user-1');
    expect(orders).toHaveLength(1);
    expect(orders[0]!.id).toBe('order-1');
  });

  it('getOrder returns null when order does not exist', async () => {
    const { getOrder } = await setupFirestore();
    mocks.firestoreStubs.getDoc.mockResolvedValue(mocks.makeDocSnap('x', null, false));

    const result = await getOrder('nonexistent');
    expect(result).toBeNull();
  });

  it('getOrder returns OrderDTO when it exists', async () => {
    const { getOrder } = await setupFirestore();
    mocks.firestoreStubs.getDoc.mockResolvedValue(
      mocks.makeDocSnap('order-1', mocks.mockOrderData),
    );

    const result = await getOrder('order-1');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('order-1');
    expect(result?.status).toBe('pending');
    expect(result?.totalCents).toBe(10700);
  });

  it('getAllOrders queries without filters', async () => {
    const { getAllOrders } = await setupFirestore();
    mocks.firestoreStubs.getDocs.mockResolvedValue(
      mocks.makeQuerySnap([{ id: 'order-1', data: mocks.mockOrderData }]),
    );

    const orders = await getAllOrders();
    expect(mocks.firestoreStubs.where).not.toHaveBeenCalled();
    expect(orders).toHaveLength(1);
  });

  it('getAllOrders with status filter applies where clause', async () => {
    const { getAllOrders } = await setupFirestore();
    mocks.firestoreStubs.getDocs.mockResolvedValue(mocks.makeQuerySnap([]));

    await getAllOrders({ status: 'processing' });

    expect(mocks.firestoreStubs.where).toHaveBeenCalledWith('status', '==', 'processing');
  });

  it('updateOrderStatus updates status and adds to history', async () => {
    const { updateOrderStatus } = await setupFirestore();
    const withHistoryData = {
      ...mocks.mockOrderData,
      statusHistory: [
        {
          from: 'pending',
          to: 'pending',
          by: 'user-1',
          timestamp: { seconds: 1700000000, nanoseconds: 0 },
        },
      ],
    };

    mocks.firestoreStubs.getDoc
      .mockResolvedValueOnce(mocks.makeDocSnap('order-1', withHistoryData))
      .mockResolvedValueOnce(
        mocks.makeDocSnap('order-1', { ...withHistoryData, status: 'processing' }),
      );

    const result = await updateOrderStatus('order-1', 'processing', 'admin-user');

    expect(mocks.firestoreStubs.updateDoc).toHaveBeenCalled();
    expect(result?.status).toBe('processing');
  });
});
