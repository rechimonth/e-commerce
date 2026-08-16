import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockInitializeApp = vi.fn();
  const mockGetApps = vi.fn(() => []);
  const mockGetAuth = vi.fn(() => ({ _type: 'Auth' }));
  const mockGetFirestore = vi.fn(() => ({ _type: 'Firestore' }));
  return { mockInitializeApp, mockGetApps, mockGetAuth, mockGetFirestore };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  mocks.mockGetApps.mockReturnValue([]);
});

vi.mock('firebase/app', () => ({
  initializeApp: mocks.mockInitializeApp,
  getApps: mocks.mockGetApps,
}));
vi.mock('firebase/auth', () => ({
  getAuth: mocks.mockGetAuth,
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: mocks.mockGetFirestore,
}));

describe('Firebase config', () => {
  it('getFirebaseConfig reads from env vars', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test.appspot.com');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456');
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'test-app-id');

    const { getFirebaseConfig } = await import('@/infrastructure/firebase/config');
    const config = getFirebaseConfig();
    expect(config.apiKey).toBe('test-key');
    expect(config.authDomain).toBe('test.firebaseapp.com');
    expect(config.projectId).toBe('test-project');
    expect(config.storageBucket).toBe('test.appspot.com');
    expect(config.messagingSenderId).toBe('123456');
    expect(config.appId).toBe('test-app-id');
  });

  it('initializeFirebase calls initializeApp with correct config', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test.appspot.com');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456');
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'test-app-id');

    const { initializeFirebase, _resetFirebaseForTesting } =
      await import('@/infrastructure/firebase/config');
    _resetFirebaseForTesting();

    mocks.mockInitializeApp.mockReturnValue({ _type: 'App' });

    const app = initializeFirebase();
    expect(mocks.mockInitializeApp).toHaveBeenCalledOnce();
    expect(mocks.mockInitializeApp).toHaveBeenCalledWith({
      apiKey: 'test-key',
      authDomain: 'test.firebaseapp.com',
      projectId: 'test-project',
      storageBucket: 'test.appspot.com',
      messagingSenderId: '123456',
      appId: 'test-app-id',
    });
    expect(mocks.mockGetAuth).toHaveBeenCalled();
    expect(mocks.mockGetFirestore).toHaveBeenCalled();
    expect(app).toEqual({ _type: 'App' } as unknown);
  });

  it('initializeFirebase is idempotent (returns same app on second call)', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');

    const { initializeFirebase, _resetFirebaseForTesting } =
      await import('@/infrastructure/firebase/config');
    _resetFirebaseForTesting();

    mocks.mockInitializeApp.mockReturnValue({ _type: 'App' });

    const app1 = initializeFirebase();
    const app2 = initializeFirebase();
    expect(mocks.mockInitializeApp).toHaveBeenCalledTimes(1);
    expect(app1).toBe(app2);
  });

  it('initializeFirebase throws when config is missing', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');

    const { initializeFirebase, _resetFirebaseForTesting, FirebaseInfraError } =
      await import('@/infrastructure/firebase/config');
    _resetFirebaseForTesting();

    expect(() => initializeFirebase()).toThrow(FirebaseInfraError);
  });

  it('getFirebaseAuth calls initializeFirebase if not yet initialized', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');

    const { getFirebaseAuth, _resetFirebaseForTesting } =
      await import('@/infrastructure/firebase/config');
    _resetFirebaseForTesting();

    mocks.mockInitializeApp.mockReturnValue({ _type: 'App' });

    getFirebaseAuth();
    expect(mocks.mockGetAuth).toHaveBeenCalled();
    expect(mocks.mockInitializeApp).toHaveBeenCalled();
  });

  it('getFirebaseDb calls initializeFirebase if not yet initialized', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');

    const { getFirebaseDb, _resetFirebaseForTesting } =
      await import('@/infrastructure/firebase/config');
    _resetFirebaseForTesting();

    mocks.mockInitializeApp.mockReturnValue({ _type: 'App' });

    getFirebaseDb();
    expect(mocks.mockGetFirestore).toHaveBeenCalled();
    expect(mocks.mockInitializeApp).toHaveBeenCalled();
  });
});

describe('FirebaseInfraError', () => {
  it('extends Error', async () => {
    const { FirebaseInfraError } = await import('@/infrastructure/firebase/config');
    const err = new FirebaseInfraError('NOT_FOUND', 'User not found', { uid: '123' });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('FirebaseInfraError');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('User not found');
    expect(err.details).toEqual({ uid: '123' });
  });
});

describe('mapFirebaseError', () => {
  it('maps auth/invalid-email to VALIDATION_ERROR', async () => {
    const { mapFirebaseError } = await import('@/infrastructure/firebase/config');
    const result = mapFirebaseError({
      code: 'auth/invalid-email',
      message: 'The email address is badly formatted.',
    });
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.message).toBe('The email address is badly formatted.');
  });

  it('maps auth/email-already-in-use to CONFLICT', async () => {
    const { mapFirebaseError } = await import('@/infrastructure/firebase/config');
    const result = mapFirebaseError({
      code: 'auth/email-already-in-use',
      message: 'Email already in use',
    });
    expect(result.code).toBe('CONFLICT');
  });

  it('maps auth/wrong-password to UNAUTHORIZED', async () => {
    const { mapFirebaseError } = await import('@/infrastructure/firebase/config');
    const result = mapFirebaseError({
      code: 'auth/wrong-password',
      message: 'Wrong password',
    });
    expect(result.code).toBe('UNAUTHORIZED');
  });

  it('maps firestore/permission-denied to FORBIDDEN', async () => {
    const { mapFirebaseError } = await import('@/infrastructure/firebase/config');
    const result = mapFirebaseError({
      code: 'firestore/permission-denied',
      message: 'Missing or insufficient permissions',
    });
    expect(result.code).toBe('FORBIDDEN');
  });

  it('maps unknown errors to INTERNAL_ERROR', async () => {
    const { mapFirebaseError } = await import('@/infrastructure/firebase/config');
    const result = mapFirebaseError({
      code: 'unknown/error',
      message: 'Something went wrong',
    });
    expect(result.code).toBe('INTERNAL_ERROR');
  });

  it('passes through FirebaseInfraError unchanged', async () => {
    const { mapFirebaseError, FirebaseInfraError } =
      await import('@/infrastructure/firebase/config');
    const original = new FirebaseInfraError('NETWORK_ERROR', 'Network failed');
    const result = mapFirebaseError(original);
    expect(result).toBe(original);
  });
});
