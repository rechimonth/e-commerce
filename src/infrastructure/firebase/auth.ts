/**
 * Funciones de Firebase Authentication e Infraestructura de Usuarios.
 *
 * Esta capa abstrae el Firebase Auth SDK y las operaciones de usuario
 * en Firestore. NO debe usarse directamente desde componentes — usamos
 * los hooks/services que consumen estas funciones.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import type { UserProfileDTO, UserRole, UserRoleState } from '@/types/auth';
import { getFirebaseAuth, getFirebaseDb, firebaseTryCatch } from './config';

const provider = new GoogleAuthProvider();

/**
 * Inicia sesión con email/password.
 * @throws FirebaseInfraError si las credenciales son inválidas.
 */
export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  return firebaseTryCatch(async () => {
    const auth = getFirebaseAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  });
}

/**
 * Registra un nuevo usuario con email/password y crea su perfil en Firestore.
 * @throws FirebaseInfraError si el email ya está registrado o la contraseña es débil.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<FirebaseUser> {
  return firebaseTryCatch(async () => {
    const auth = getFirebaseAuth();
    const result = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName) {
      await updateProfile(result.user, { displayName });
    }

    const profile: UserProfileDTO = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName ?? displayName ?? null,
      photoURL: result.user.photoURL ?? null,
      role: 'customer' as UserRole,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      preferences: {
        currency: 'USD',
        locale: 'es-MX',
        notifications: true,
      },
    };
    await createUserProfile(profile);

    return result.user;
  });
}

/**
 * Inicia sesión con Google mediante popup.
 * @throws FirebaseInfraError si el usuario cierra el popup o hay errores de red.
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  return firebaseTryCatch(async () => {
    const auth = getFirebaseAuth();
    const result = await signInWithPopup(auth, provider);

    const profile: UserProfileDTO = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName ?? null,
      photoURL: result.user.photoURL ?? null,
      role: 'customer' as UserRole,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      preferences: {
        currency: 'USD',
        locale: 'es-MX',
        notifications: true,
      },
    };
    await createUserProfile(profile);

    return result.user;
  });
}

/**
 * Cierra la sesión del usuario actual.
 */
export async function signOutUser(): Promise<void> {
  return firebaseTryCatch(async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
  });
}

/**
 * Observa cambios en el estado de autenticación.
 * Cada vez que el usuario se autentica/desautentica, se obtiene su perfil
 * de Firestore (incluyendo el rol) y se pasa al callback.
 *
 * Durante la carga del rol, el callback puede recibir `null` mientras
 * esperan los datos del perfil — el AuthContext maneja el estado loading.
 *
 * @returns función para desuscribirse.
 */
export function observeAuthState(callback: (user: UserProfileDTO | null) => void): () => void {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const profile = await getUserProfileFromDb(firebaseUser.uid, db);
      callback(profile);
    } catch {
      callback(null);
    }
  });
}

/**
 * Obtiene el perfil de usuario desde Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserProfileDTO | null> {
  return firebaseTryCatch(async () => {
    const db = getFirebaseDb();
    return getUserProfileFromDb(uid, db);
  });
}

async function getUserProfileFromDb(uid: string, db: Firestore): Promise<UserProfileDTO | null> {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (!docSnap.exists()) return null;

  const data = docSnap.data();

  return {
    uid: docSnap.id,
    email: data.email ?? null,
    displayName: data.displayName ?? null,
    photoURL: data.photoURL ?? null,
    role: (data.role ?? 'customer') as UserRole,
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
    lastLoginAt: data.lastLoginAt?.toMillis?.() ?? Date.now(),
    preferences: {
      currency: (data.preferences?.currency ?? 'USD') as UserProfileDTO['preferences']['currency'],
      locale: data.preferences?.locale ?? 'es-MX',
      notifications: data.preferences?.notifications ?? true,
    },
  };
}

/**
 * Crea o actualiza el perfil de usuario en Firestore.
 */
export async function createUserProfile(profile: UserProfileDTO): Promise<void> {
  return firebaseTryCatch(async () => {
    const db = getFirebaseDb();
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(
      docRef,
      {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        role: profile.role,
        createdAt:
          typeof profile.createdAt === 'number'
            ? Timestamp.fromMillis(profile.createdAt)
            : serverTimestamp(),
        lastLoginAt: Timestamp.fromMillis(profile.lastLoginAt),
        preferences: profile.preferences,
      },
      { merge: true },
    );
  });
}

/**
 * Deriva UserRoleState del estado de autenticación actual.
 * Útil para el AuthContext durante el bootstrap de la sesión.
 */
export async function resolveUserRoleState(uid: string | null): Promise<UserRoleState> {
  if (!uid) return 'unauthenticated';

  const profile = await getUserProfile(uid);
  if (!profile) return 'unauthenticated';

  return profile.role === 'admin' ? 'admin' : 'customer';
}
