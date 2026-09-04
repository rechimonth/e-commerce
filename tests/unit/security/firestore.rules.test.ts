/**
 * Firestore Security Rules tests using the Firebase Emulator.
 *
 * PREREQUISITES:
 *   1. Install the Firebase CLI:  npm install -g firebase-tools
 *   2. Start the emulator suite:   npx firebase emulators:start --only firestore,auth
 *   3. Run the tests:              npm run test:rules
 *
 * If the emulator is NOT running, tests are skipped automatically.
 * In CI, use:  npx firebase emulators:exec "npm run test:rules"
 */
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import type { RulesTestEnvironment, RulesTestContext } from '@firebase/rules-unit-testing';

const RUN_RULES_TESTS = process.env.RUN_RULES_TESTS === 'true';
const MaybeDescribe = RUN_RULES_TESTS ? describe : describe.skip;

MaybeDescribe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;
  let assertFails: (p: Promise<unknown>) => Promise<unknown>;
  let assertSucceeds: (p: Promise<unknown>) => Promise<unknown>;
  const TEST_PROJECT_ID = 'e-commerce-ai-test';

  function customer1Env(): RulesTestContext { return testEnv.authenticatedContext('customer-1'); }
  function adminEnv(): RulesTestContext { return testEnv.authenticatedContext('admin-1'); }
  function unauthEnv(): RulesTestContext { return testEnv.unauthenticatedContext(); }

  const validProduct = {
    id: 'prod-1', name: 'Test Product', description: 'A test product', priceCents: 9999,
    currency: 'USD', category: 'action-figures', imageKey: 'img-1',
    imageUrl: 'https://example.com/img.png', stock: 10, rating: 4.5, reviewCount: 100,
    isActive: true, createdAt: { seconds: 1700000000, nanoseconds: 0 },
    updatedAt: { seconds: 1700000000, nanoseconds: 0 }, createdBy: 'admin-uid',
  };

  function validOrder(uid: string) {
    return {
      id: 'order-1', userId: uid,
      items: [{ productId: 'p1', name: 'Product 1', priceCents: 5000, quantity: 2, imageUrl: 'https://example.com/p1.png', orderId: 'order-1' }],
      subtotalCents: 10000, taxCents: 700, shippingCents: 0, discountCents: 0, totalCents: 10700,
      currency: 'USD', status: 'pending',
      statusHistory: [{ from: 'pending', to: 'pending', by: uid, timestamp: { seconds: 1700000000, nanoseconds: 0 } }],
      shippingAddress: { street: '123 Main St', city: 'NYC', state: 'NY', zipCode: '10001', country: 'USA' },
      billingAddress: { street: '123 Main St', city: 'NYC', state: 'NY', zipCode: '10001', country: 'USA' },
      paymentMethod: 'card', notes: 'Test order',
      createdAt: { seconds: 1700000000, nanoseconds: 0 }, updatedAt: { seconds: 1700000000, nanoseconds: 0 },
    };
  }

  const customer1Profile = {
    uid: 'customer-1', email: 'customer1@test.com', displayName: 'Customer One', photoURL: null,
    role: 'customer', createdAt: 1700000000000, lastLoginAt: 1700000000000,
    preferences: { currency: 'USD', locale: 'es-MX', notifications: true },
  };
  const adminProfile = {
    uid: 'admin-1', email: 'admin1@test.com', displayName: 'Admin One', photoURL: null,
    role: 'admin', createdAt: 1700000000000, lastLoginAt: 1700000000000,
    preferences: { currency: 'USD', locale: 'es-MX', notifications: true },
  };

  beforeAll(async () => {
    const mod = await import('@firebase/rules-unit-testing');
    const { initializeTestEnvironment } = mod;
    assertFails = mod.assertFails;
    assertSucceeds = mod.assertSucceeds;
    testEnv = await initializeTestEnvironment({ projectId: TEST_PROJECT_ID, firestore: { host: '127.0.0.1', port: 8080 } });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await adminDb.doc('users/customer-1').set(customer1Profile);
      await adminDb.doc('users/admin-1').set(adminProfile);
      await adminDb.doc('products/prod-1').set(validProduct);
      await adminDb.doc('orders/order-1').set(validOrder('customer-1'));
      await adminDb.doc('orders/admin-order').set(validOrder('admin-1'));
    });
  });

  afterAll(async () => { await testEnv.cleanup(); });

  describe('users/{uid}', () => {
    it('customer can read own profile', async () => { await assertSucceeds(customer1Env().firestore().doc('users/customer-1').get()); });
    it('customer cannot read admin profile', async () => { await assertFails(customer1Env().firestore().doc('users/admin-1').get()); });
    it('admin can read any user profile', async () => { await assertSucceeds(adminEnv().firestore().doc('users/customer-1').get()); });
    it('customer can create own profile with role=customer', async () => { await assertSucceeds(testEnv.authenticatedContext('new-user').firestore().doc('users/new-user').set(customer1Profile)); });
    it('customer cannot set role=admin on creation', async () => { await assertFails(testEnv.authenticatedContext('hacker').firestore().doc('users/hacker').set({ ...customer1Profile, uid: 'hacker', role: 'admin' })); });
    it('customer cannot change own role', async () => { await assertFails(customer1Env().firestore().doc('users/customer-1').update({ role: 'admin' })); });
    it('admin can update any user profile', async () => { await assertSucceeds(adminEnv().firestore().doc('users/customer-1').update({ lastLoginAt: 1700000001000 })); });
    it('customer cannot delete own profile', async () => { await assertFails(customer1Env().firestore().doc('users/customer-1').delete()); });
  });

  describe('products/{productId}', () => {
    it('authenticated user can read products', async () => { await assertSucceeds(customer1Env().firestore().doc('products/prod-1').get()); });
    it('anonymous user can read products', async () => { await assertSucceeds(unauthEnv().firestore().doc('products/prod-1').get()); });
    it('customer cannot create products', async () => { await assertFails(customer1Env().firestore().doc('products/new-prod').set(validProduct)); });
    it('admin can create products', async () => { await assertSucceeds(adminEnv().firestore().doc('products/prod-2').set({ ...validProduct, id: 'prod-2' })); });
    it('admin can update products', async () => { await assertSucceeds(adminEnv().firestore().doc('products/prod-1').update({ name: 'Updated' })); });
    it('customer cannot update products', async () => { await assertFails(customer1Env().firestore().doc('products/prod-1').update({ name: 'Hacked' })); });
    it('admin can delete products', async () => { await assertSucceeds(adminEnv().firestore().doc('products/prod-2').delete()); });
  });

  describe('orders/{orderId}', () => {
    it('customer cannot create orders directly', async () => { await assertFails(customer1Env().firestore().doc('orders/order-cust1').set(validOrder('customer-1'))); });
    it('customer cannot create order for another user', async () => { await assertFails(customer1Env().firestore().doc('orders/order-hack').set(validOrder('admin-1'))); });
    it('customer cannot set status=processing on creation', async () => { await assertFails(customer1Env().firestore().doc('orders/order-bad').set({ ...validOrder('customer-1'), status: 'processing' })); });
    it('customer can read own order', async () => { await assertSucceeds(customer1Env().firestore().doc('orders/order-1').get()); });
    it('customer cannot read admin order', async () => { await assertFails(customer1Env().firestore().doc('orders/admin-order').get()); });
    it('customer cannot list all orders', async () => { await assertFails(customer1Env().firestore().collection('orders').limit(10).get()); });
    it('admin can list all orders', async () => { await assertSucceeds(adminEnv().firestore().collection('orders').limit(10).get()); });
    it('customer can list only their own orders with a userId query', async () => { await assertSucceeds(customer1Env().firestore().collection('orders').where('userId', '==', 'customer-1').limit(10).get()); });
    it('customer cannot change order status', async () => { await assertFails(customer1Env().firestore().doc('orders/order-1').update({ status: 'processing' })); });
    it('customer cannot change order total', async () => { await assertFails(customer1Env().firestore().doc('orders/order-1').update({ totalCents: 100 })); });
    it('customer cannot change order userId', async () => { await assertFails(customer1Env().firestore().doc('orders/order-1').update({ userId: 'admin-1' })); });
    it('customer can update own order notes', async () => { await assertSucceeds(customer1Env().firestore().doc('orders/order-1').update({ notes: 'New note' })); });
    it('admin can change order status', async () => { await assertSucceeds(adminEnv().firestore().doc('orders/order-1').update({ status: 'processing' })); });
    it('admin can update order totals', async () => { await assertSucceeds(adminEnv().firestore().doc('orders/order-1').update({ totalCents: 9999 })); });
  });

  describe('cross-user access prevention', () => {
    it('customer cannot overwrite admin user doc', async () => { await assertFails(customer1Env().firestore().doc('users/admin-1').set({ role: 'customer' })); });
    it('unauthenticated user cannot create orders', async () => { await assertFails(unauthEnv().firestore().doc('orders/new').set(validOrder('someone'))); });
  });
});
