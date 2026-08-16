import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { AuthContext } from '@/contexts/AuthContext';

const mockAuthValue = {
  user: { uid: 'user-1', email: 'test@test.com', displayName: 'Test', photoURL: null, role: 'customer', createdAt: new Date(), lastLoginAt: new Date(), preferences: { currency: 'USD', locale: 'es-MX', notifications: true } },
  roleState: 'customer' as const,
  session: { uid: 'user-1', role: 'customer', isAuthenticated: true },
  isLoading: false,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshUserProfile: async () => {},
  clearError: () => {},
};

describe('useAuth', () => {
  it('retorna el valor del contexto', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockAuthValue}>{children}</AuthContext.Provider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeDefined();
    expect(result.current.roleState).toBe('customer');
    expect(result.current.isLoading).toBe(false);
  });

  it('lanza error cuando se usa fuera del provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    consoleError.mockRestore();
  });

  it('expone los callbacks de auth', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockAuthValue}>{children}</AuthContext.Provider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signInWithGoogle).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });
});
