import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@test.com',
    displayName: 'Test User',
    photoURL: null,
    metadata: { creationTime: '2024-01-01', lastSignInTime: '2024-01-02' },
    updateEmail: vi.fn(),
    updateProfile: vi.fn(),
    getIdToken: vi.fn(),
    toJSON: vi.fn(),
    refreshToken: '',
    providerData: [],
    isAnonymous: false,
    phoneNumber: null,
    providerId: '',
    tenantId: null,
    delete: vi.fn(),
  };

  const mockUserCredential = { user: mockUser, _tokenResponse: {} };
  const mockAuth = { _type: 'Auth' };
  const mockDb = { _type: 'Firestore' };
  const unsubscribe = vi.fn();

  const authStubs = {
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn().mockImplementation(function GoogleAuthProvider() {
      return { _type: 'GoogleProvider' };
    }),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
    updateProfile: vi.fn(),
    getAuth: vi.fn(() => mockAuth),
  };

  const firestoreStubs = {
    doc: vi.fn(() => ({ _ref: 'users/test-uid', id: 'test-uid' })),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    addDoc: vi.fn(),
    collection: vi.fn(() => ({ _collection: 'test' })),
    query: vi.fn((ref, ...constraints) => ({ _ref: ref, _constraints: constraints })),
    where: vi.fn((field, op, value) => ({ _where: { field, op, value } })),
    orderBy: vi.fn((field, dir) => ({ _orderBy: { field, dir } })),
    limit: vi.fn((n) => ({ _limit: n })),
    serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
    Timestamp: {
      fromMillis: vi.fn((ms) => ({ _type: 'Timestamp', _ms: ms })),
      fromDate: vi.fn((d) => ({ _type: 'Timestamp', _date: d })),
      prototype: { toMillis: vi.fn() },
    },
    getFirestore: vi.fn(() => mockDb),
  };

  return {
    authStubs,
    firestoreStubs,
    mockUser,
    mockUserCredential,
    mockAuth,
    mockDb,
    unsubscribe,
  };
});

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ _type: 'App' })),
  getApps: vi.fn(() => []),
}));
vi.mock('firebase/auth', () => mocks.authStubs);
vi.mock('firebase/firestore', () => mocks.firestoreStubs);

describe('Firebase auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test.appspot.com');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456');
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'test-app-id');

    mocks.authStubs.getAuth.mockReturnValue(mocks.mockAuth);
    mocks.firestoreStubs.getFirestore.mockReturnValue(mocks.mockDb);
    mocks.firestoreStubs.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'test-uid',
        email: 'test@test.com',
        displayName: 'Test User',
        photoURL: null,
        role: 'customer',
        createdAt: { toMillis: () => 1700000000000 },
        lastLoginAt: { toMillis: () => 1700000000000 },
        preferences: { currency: 'USD', locale: 'es-MX', notifications: true },
      }),
      id: 'test-uid',
    });
  });

  async function setupAuth() {
    const config = await import('@/infrastructure/firebase/config');
    config._resetFirebaseForTesting();
    config.initializeFirebase();
    return await import('@/infrastructure/firebase/auth');
  }

  it('signInWithEmail calls signInWithEmailAndPassword with auth and credentials', async () => {
    const { signInWithEmail } = await setupAuth();
    mocks.authStubs.signInWithEmailAndPassword.mockResolvedValue(mocks.mockUserCredential);

    const result = await signInWithEmail('test@test.com', 'password123');

    expect(mocks.authStubs.signInWithEmailAndPassword).toHaveBeenCalledWith(
      mocks.mockAuth,
      'test@test.com',
      'password123',
    );
    expect(result.uid).toBe('test-uid');
  });

  it('signUpWithEmail creates auth user, updates profile, and creates Firestore profile', async () => {
    const { signUpWithEmail } = await setupAuth();
    mocks.authStubs.createUserWithEmailAndPassword.mockResolvedValue(mocks.mockUserCredential);
    mocks.authStubs.updateProfile.mockResolvedValue(undefined);
    mocks.firestoreStubs.setDoc.mockResolvedValue(undefined);

    const result = await signUpWithEmail('test@test.com', 'password123', 'Test User');

    expect(mocks.authStubs.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      mocks.mockAuth,
      'test@test.com',
      'password123',
    );
    expect(mocks.authStubs.updateProfile).toHaveBeenCalledWith(mocks.mockUser, {
      displayName: 'Test User',
    });
    expect(mocks.firestoreStubs.setDoc).toHaveBeenCalled();
    expect(result.uid).toBe('test-uid');
  });

  it('signInWithGoogle calls signInWithPopup and creates profile if new', async () => {
    const { signInWithGoogle } = await setupAuth();
    mocks.authStubs.signInWithPopup.mockResolvedValue(mocks.mockUserCredential);
    mocks.firestoreStubs.setDoc.mockResolvedValue(undefined);
    mocks.firestoreStubs.getDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
    });

    const result = await signInWithGoogle();

    expect(mocks.authStubs.signInWithPopup).toHaveBeenCalledWith(mocks.mockAuth, {
      _type: 'GoogleProvider',
    });
    expect(mocks.firestoreStubs.setDoc).toHaveBeenCalled();
    expect(result.uid).toBe('test-uid');
  });

  it('signOutUser calls signOut', async () => {
    const { signOutUser } = await setupAuth();
    mocks.authStubs.signOut.mockResolvedValue(undefined);

    await signOutUser();

    expect(mocks.authStubs.signOut).toHaveBeenCalledWith(mocks.mockAuth);
  });

  it('observeAuthState returns unsubscribe function', async () => {
    const { observeAuthState } = await setupAuth();
    mocks.authStubs.onAuthStateChanged.mockImplementation(() => {
      return mocks.unsubscribe;
    });

    const callback = vi.fn();
    const unsub = observeAuthState(callback);

    expect(mocks.authStubs.onAuthStateChanged).toHaveBeenCalled();
    expect(typeof unsub).toBe('function');
    expect(mocks.unsubscribe).toBe(unsub);
  });

  it('getUserProfile returns UserProfileDTO from Firestore', async () => {
    const { getUserProfile } = await setupAuth();

    const profile = await getUserProfile('test-uid');

    expect(mocks.firestoreStubs.doc).toHaveBeenCalledWith(mocks.mockDb, 'users', 'test-uid');
    expect(mocks.firestoreStubs.getDoc).toHaveBeenCalled();
    expect(profile).not.toBeNull();
    expect(profile?.uid).toBe('test-uid');
    expect(profile?.role).toBe('customer');
    expect(profile?.email).toBe('test@test.com');
    expect(profile?.preferences.currency).toBe('USD');
  });

  it('getUserProfile returns null when user doc does not exist', async () => {
    const { getUserProfile } = await setupAuth();
    mocks.firestoreStubs.getDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
    });

    const profile = await getUserProfile('nonexistent');
    expect(profile).toBeNull();
  });

  it('createUserProfile writes to Firestore with merge option', async () => {
    const { createUserProfile } = await setupAuth();
    mocks.firestoreStubs.setDoc.mockResolvedValue(undefined);

    const profile = {
      uid: 'test-uid',
      email: 'test@test.com',
      displayName: null,
      photoURL: null,
      role: 'customer' as const,
      createdAt: 1700000000000,
      lastLoginAt: 1700000000000,
      preferences: { currency: 'USD' as const, locale: 'es-MX', notifications: true },
    };

    await createUserProfile(profile);

    expect(mocks.firestoreStubs.doc).toHaveBeenCalledWith(mocks.mockDb, 'users', 'test-uid');
    expect(mocks.firestoreStubs.setDoc).toHaveBeenCalled();
  });

  it('signInWithEmail wraps Firebase errors in FirebaseInfraError', async () => {
    const { signInWithEmail } = await setupAuth();
    const { FirebaseInfraError } = await import('@/infrastructure/firebase/config');
    mocks.authStubs.signInWithEmailAndPassword.mockRejectedValue({
      code: 'auth/wrong-password',
      message: 'Wrong password',
    });

    await expect(signInWithEmail('test@test.com', 'wrong')).rejects.toThrow(FirebaseInfraError);
  });
});

