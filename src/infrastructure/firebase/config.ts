/**
 * Configuración e inicialización de Firebase.
 *
 * Todas las credenciales provienen de variables VITE_* leídas en runtime
 * via import.meta.env — NUNCA se escriben valores reales en código.
 */
import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import type { ServiceErrorCode } from '@/types/api';

export type FirebaseConfig = FirebaseOptions;

export function getFirebaseConfig(): FirebaseConfig {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;

/**
 * Inicializa Firebase de forma lazy. Lanza error si la configuración
 * es incompleta (apiKey y projectId son obligatorios).
 */
export function initializeFirebase(): FirebaseApp {
  if (_app) return _app;

  if (getApps().length > 0) {
    _app = getApps()[0]!;
    _auth = getAuth(_app);
    _db = getFirestore(_app);
    return _app;
  }

  const config = getFirebaseConfig();

  if (!config.apiKey || !config.projectId) {
    throw new FirebaseInfraError(
      'INTERNAL_ERROR',
      'Firebase configuration missing. Set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in .env',
      { missing: ['apiKey', 'projectId'].filter((k) => !config[k as keyof FirebaseConfig]) },
    );
  }

  _app = initializeApp(config);
  _auth = getAuth(_app);
  _db = getFirestore(_app);

  return _app;
}

export function getFirebaseApp(): FirebaseApp {
  if (!_app) initializeFirebase();
  return _app!;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) initializeFirebase();
  return _auth!;
}

export function getFirebaseDb(): Firestore {
  if (!_db) initializeFirebase();
  return _db!;
}

/**
 * Error tipado para la capa de infraestructura.
 * Envuelve errores de Firebase SDK con un código mappeado.
 */
export class FirebaseInfraError extends Error {
  readonly code: ServiceErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: ServiceErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'FirebaseInfraError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Mapea errores del Firebase SDK a ServiceError.
 * Los códigos de Firebase (auth/xxx, firestore/xxx) se traducen a
 * nuestros ServiceErrorCode para mantener consistencia.
 */
const FIREBASE_ERROR_MAP: Readonly<Record<string, ServiceErrorCode>> = {
  'auth/invalid-email': 'VALIDATION_ERROR',
  'auth/user-not-found': 'NOT_FOUND',
  'auth/wrong-password': 'UNAUTHORIZED',
  'auth/email-already-in-use': 'CONFLICT',
  'auth/weak-password': 'VALIDATION_ERROR',
  'auth/popup-closed-by-user': 'VALIDATION_ERROR',
  'auth/network-request-failed': 'NETWORK_ERROR',
  'auth/too-many-requests': 'QUOTA_EXCEEDED',
  'auth/missing-android-api-key': 'INTERNAL_ERROR',
  'auth/missing-ios-api-key': 'INTERNAL_ERROR',
  'auth/invalid-api-key': 'UNAUTHORIZED',
  'firestore/deadline-exceeded': 'INTERNAL_ERROR',
  'firestore/cancelled': 'INTERNAL_ERROR',
  'firestore/unavailable': 'INTERNAL_ERROR',
  'firestore/permission-denied': 'FORBIDDEN',
  'firestore/resource-exhausted': 'QUOTA_EXCEEDED',
  'firestore/failed-precondition': 'VALIDATION_ERROR',
  'firestore/aborted': 'INTERNAL_ERROR',
  'firestore/internal': 'INTERNAL_ERROR',
};

export function mapFirebaseError(error: unknown): FirebaseInfraError {
  if (error instanceof FirebaseInfraError) return error;

  const code = (error as { code?: string })?.code;
  const message = (error as { message?: string })?.message ?? 'An unknown error occurred';
  const mappedCode = code ? (FIREBASE_ERROR_MAP[code] ?? 'INTERNAL_ERROR') : 'INTERNAL_ERROR';

  return new FirebaseInfraError(mappedCode, message, { originalCode: code });
}

/**
 * Wrapper que captura errores de Firebase y los mapea a FirebaseInfraError.
 * Útil para funciones async que deben relanzar errores tipados.
 */
export async function firebaseTryCatch<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

/**
 * Reinicia el estado de inicialización. SOLO para tests.
 */
export function _resetFirebaseForTesting(): void {
  _app = undefined;
  _auth = undefined;
  _db = undefined;
}
