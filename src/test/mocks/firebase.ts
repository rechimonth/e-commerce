import { vi } from 'vitest';

export const mockSignInWithEmailAndPassword = vi.fn();
export const mockCreateUserWithEmailAndPassword = vi.fn();
export const mockSignInWithPopup = vi.fn();
export const mockGoogleAuthProvider = vi.fn(function () { return {}; });
export const mockSignOut = vi.fn();
export const mockOnAuthStateChanged = vi.fn();
export const mockUpdateProfile = vi.fn();

export const mockGetDoc = vi.fn();
export const mockGetDocs = vi.fn();
export const mockUpdateDoc = vi.fn();
export const mockDeleteDoc = vi.fn();
export const mockAddDoc = vi.fn();
export const mockQuery = vi.fn();
export const mockWhere = vi.fn();
export const mockOrderBy = vi.fn();
export const mockLimit = vi.fn();
export const mockServerTimestamp = vi.fn();
export const mockTimestamp = vi.fn();

export function setupFirebaseMocks() {
  vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
    createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
    signInWithPopup: mockSignInWithPopup,
    GoogleAuthProvider: mockGoogleAuthProvider,
    signOut: mockSignOut,
    onAuthStateChanged: mockOnAuthStateChanged,
    updateProfile: mockUpdateProfile,
  }));

  vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: mockGetDoc,
    getDocs: mockGetDocs,
    updateDoc: mockUpdateDoc,
    deleteDoc: mockDeleteDoc,
    addDoc: mockAddDoc,
    query: mockQuery,
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    serverTimestamp: mockServerTimestamp,
    Timestamp: mockTimestamp,
  }));
}

export function clearFirebaseMocks() {
  mockSignInWithEmailAndPassword.mockClear();
  mockCreateUserWithEmailAndPassword.mockClear();
  mockSignInWithPopup.mockClear();
  mockGoogleAuthProvider.mockClear();
  mockSignOut.mockClear();
  mockOnAuthStateChanged.mockClear();
  mockUpdateProfile.mockClear();
  mockGetDoc.mockClear();
  mockGetDocs.mockClear();
  mockUpdateDoc.mockClear();
  mockDeleteDoc.mockClear();
  mockAddDoc.mockClear();
  mockQuery.mockClear();
  mockWhere.mockClear();
  mockOrderBy.mockClear();
  mockLimit.mockClear();
  mockServerTimestamp.mockClear();
  mockTimestamp.mockClear();
}