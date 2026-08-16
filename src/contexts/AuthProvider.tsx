import { useState, useCallback, useEffect } from 'react';
import type { UserProfile, UserRoleState, AuthSession } from '@/types/auth';
import type { ServiceError } from '@/types/api';
import type { LoginCredentials, RegisterCredentials } from '@/types/auth';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutUser,
  getUserProfile,
  observeAuthState,
} from '@/infrastructure/firebase/auth';
import { toUserProfile } from '@/infrastructure/firebase/adapters';
import { AuthContext } from '@/contexts/AuthContext';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roleState, setRoleState] = useState<UserRoleState>('loading');
  const [error, setError] = useState<ServiceError | null>(null);

  const isLoading = roleState === 'loading';

  const clearError = useCallback(() => setError(null), []);

  const handleSignIn = useCallback(async (credentials: LoginCredentials) => {
    setError(null);
    try {
      const firebaseUser = await signInWithEmail(credentials.email, credentials.password);
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        const domainUser = toUserProfile(profile);
        setUser(domainUser);
        setRoleState(profile.role === 'admin' ? 'admin' : 'customer');
      } else {
        setRoleState('unauthenticated');
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      setError({
        code: (err.code as ServiceError['code']) ?? 'INTERNAL_ERROR',
        message: err.message ?? 'An error occurred',
      });
      setUser(null);
      setRoleState('unauthenticated');
    }
  }, []);

  const handleSignUp = useCallback(async (credentials: RegisterCredentials) => {
    setError(null);
    try {
      const firebaseUser = await signUpWithEmail(
        credentials.email,
        credentials.password,
        credentials.displayName,
      );
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        const domainUser = toUserProfile(profile);
        setUser(domainUser);
        setRoleState(profile.role === 'admin' ? 'admin' : 'customer');
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      setError({
        code: (err.code as ServiceError['code']) ?? 'INTERNAL_ERROR',
        message: err.message ?? 'An error occurred',
      });
      setUser(null);
      setRoleState('unauthenticated');
    }
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const firebaseUser = await signInWithGoogle();
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        const domainUser = toUserProfile(profile);
        setUser(domainUser);
        setRoleState(profile.role === 'admin' ? 'admin' : 'customer');
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      setError({
        code: (err.code as ServiceError['code']) ?? 'INTERNAL_ERROR',
        message: err.message ?? 'An error occurred',
      });
      setUser(null);
      setRoleState('unauthenticated');
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setError(null);
    try {
      await signOutUser();
      setUser(null);
      setRoleState('unauthenticated');
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      setError({
        code: (err.code as ServiceError['code']) ?? 'INTERNAL_ERROR',
        message: err.message ?? 'An error occurred',
      });
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUser(toUserProfile(profile));
        setRoleState(profile.role === 'admin' ? 'admin' : 'customer');
      } else {
        setUser(null);
        setRoleState('unauthenticated');
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      setError({
        code: (err.code as ServiceError['code']) ?? 'INTERNAL_ERROR',
        message: err.message ?? 'An error occurred',
      });
      setUser(null);
      setRoleState('unauthenticated');
    }
  }, [user?.uid]);

  useEffect(() => {
    const unsubscribe = observeAuthState((profile) => {
      if (profile) {
        setUser(toUserProfile(profile));
        setRoleState(profile.role === 'admin' ? 'admin' : 'customer');
      } else {
        setUser(null);
        setRoleState('unauthenticated');
      }
    });

    return unsubscribe;
  }, []);

  const session: AuthSession | null =
    user && roleState !== 'unauthenticated' && roleState !== 'loading'
      ? { uid: user.uid, role: user.role, isAuthenticated: true }
      : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        roleState,
        session,
        isLoading,
        error,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
        refreshUserProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
