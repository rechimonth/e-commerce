import { createContext } from 'react';
import type { UserProfile, UserRoleState, AuthSession } from '@/types/auth';
import type { ServiceError } from '@/types/api';
import type { LoginCredentials, RegisterCredentials } from '@/types/auth';

export interface AuthContextValue {
  readonly user: UserProfile | null;
  readonly roleState: UserRoleState;
  readonly session: AuthSession | null;
  readonly isLoading: boolean;
  readonly error: ServiceError | null;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: RegisterCredentials) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
