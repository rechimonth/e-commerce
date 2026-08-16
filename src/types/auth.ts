/**
 * Tipos de autenticación y usuarios.
 *
 * UserRole.LOADING es un estado explícito que existe mientras se resuelve
 * el rol del usuario tras la redirección de Firebase Auth. Durante este
 * estado, la UI muestra un loading spinner y no renderiza rutas protegidas.
 */
import type { CurrencyCode } from './pricing';

export const USER_ROLES = ['customer', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_STATES = ['loading', ...USER_ROLES, 'unauthenticated'] as const;

export type UserRoleState = (typeof USER_ROLE_STATES)[number];

export interface UserProfile {
  readonly uid: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly photoURL: string | null;
  readonly role: UserRole;
  readonly createdAt: Date;
  readonly lastLoginAt: Date;
  readonly preferences: UserPreferences;
}

export interface UserPreferences {
  readonly currency: CurrencyCode;
  readonly locale: string;
  readonly notifications: boolean;
}

export interface UserProfileDTO {
  readonly uid: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly photoURL: string | null;
  readonly role: UserRole;
  readonly createdAt: number;
  readonly lastLoginAt: number;
  readonly preferences: UserPreferences;
}

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface RegisterCredentials {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
}

export interface AuthSession {
  readonly uid: string;
  readonly role: UserRole;
  readonly isAuthenticated: true;
}
