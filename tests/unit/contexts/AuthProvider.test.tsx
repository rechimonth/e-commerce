import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthProvider';
import type { UserProfile, UserProfileDTO } from '@/types/auth';

const mockProfileDTO: UserProfileDTO = {
  uid: 'test-uid',
  email: 'test@test.com',
  displayName: 'Test User',
  photoURL: null,
  role: 'customer',
  createdAt: 1700000000000,
  lastLoginAt: 1700000000000,
  preferences: { currency: 'USD', locale: 'es-MX', notifications: true },
};

const mockAdminProfileDTO: UserProfileDTO = { ...mockProfileDTO, role: 'admin' };

vi.mock('@/infrastructure/firebase/auth', () => ({
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
  getUserProfile: vi.fn(),
  observeAuthState: vi.fn(),
}));

vi.mock('@/infrastructure/firebase/adapters', () => ({
  toUserProfile: vi.fn((dto: UserProfileDTO): UserProfile => ({
    uid: dto.uid,
    email: dto.email,
    displayName: dto.displayName,
    photoURL: dto.photoURL,
    role: dto.role,
    createdAt: new Date(dto.createdAt),
    lastLoginAt: new Date(dto.lastLoginAt),
    preferences: dto.preferences,
  })),
}));

import {
  signInWithEmail,
  signOutUser,
  getUserProfile,
  observeAuthState,
} from '@/infrastructure/firebase/auth';
import { toUserProfile } from '@/infrastructure/firebase/adapters';

function TestConsumer() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('No context');
  return (
    <div>
      <span data-testid="role-state">{ctx.roleState}</span>
      <span data-testid="user-uid">{ctx.user?.uid ?? 'null'}</span>
      <span data-testid="is-loading">{ctx.isLoading.toString()}</span>
      <span data-testid="error">{ctx.error?.message ?? 'null'}</span>
      <button onClick={() => ctx.signIn({ email: 'test@test.com', password: 'pass' })}>
        sign-in
      </button>
      <button
        onClick={() =>
          ctx.signUp({ email: 'test@test.com', password: 'pass', displayName: 'Test' })
        }
      >
        sign-up
      </button>
      <button onClick={() => ctx.signInWithGoogle()}>google-sign-in</button>
      <button onClick={() => ctx.signOut()}>sign-out</button>
      <button onClick={() => ctx.refreshUserProfile()}>refresh</button>
      <button onClick={() => ctx.clearError()}>clear-error</button>
    </div>
  );
}

describe('AuthProvider', () => {
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(observeAuthState).mockReturnValue(mockUnsubscribe);
  });

  it('starts in loading state and resolves as unauthenticated (no user)', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('role-state').textContent).toBe('loading');
    expect(screen.getByTestId('is-loading').textContent).toBe('true');

    const callback = vi.mocked(observeAuthState).mock.calls[0]![0]!;
    expect(callback).toBeDefined();
    callback(null);

    await waitFor(() => {
      expect(screen.getByTestId('role-state').textContent).toBe('unauthenticated');
    });
    expect(screen.getByTestId('is-loading').textContent).toBe('false');
  });

  it('sets user and role to customer on observeAuthState with profile', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    const callback = vi.mocked(observeAuthState).mock.calls[0]![0]!;
    callback(mockProfileDTO);

    await waitFor(() => {
      expect(screen.getByTestId('role-state').textContent).toBe('customer');
    });
    expect(screen.getByTestId('user-uid').textContent).toBe('test-uid');
    expect(toUserProfile).toHaveBeenCalledWith(mockProfileDTO);
  });

  it('sets role to admin on observeAuthState with admin profile', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    const callback = vi.mocked(observeAuthState).mock.calls[0]![0]!;
    callback(mockAdminProfileDTO);

    await waitFor(() => {
      expect(screen.getByTestId('role-state').textContent).toBe('admin');
    });
  });

  it('signIn sets user and role from profile', async () => {
    vi.mocked(signInWithEmail).mockResolvedValue({ uid: 'test-uid' } as never);
    vi.mocked(getUserProfile).mockResolvedValue(mockProfileDTO);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    const callback = vi.mocked(observeAuthState).mock.calls[0]![0]!;
    callback(null);

    await screen.findByText('sign-in').then((btn) => btn.click());

    await waitFor(() => {
      expect(screen.getByTestId('role-state').textContent).toBe('customer');
    });
    expect(screen.getByTestId('user-uid').textContent).toBe('test-uid');
  });

  it('signIn sets error on failure', async () => {
    vi.mocked(signInWithEmail).mockRejectedValue({
      code: 'auth/wrong-password',
      message: 'Wrong password',
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    const callback = vi.mocked(observeAuthState).mock.calls[0]![0]!;
    callback(null);

    await screen.findByText('sign-in').then((btn) => btn.click());

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Wrong password');
    });
    expect(screen.getByTestId('role-state').textContent).toBe('unauthenticated');
  });

  it('signOut clears user and sets unauthenticated', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    const callback = vi.mocked(observeAuthState).mock.calls[0]![0]!;
    callback(mockProfileDTO);

    await waitFor(() => {
      expect(screen.getByTestId('role-state').textContent).toBe('customer');
    });

    vi.mocked(signOutUser).mockResolvedValue(undefined);
    await screen.findByText('sign-out').then((btn) => btn.click());

    await waitFor(() => {
      expect(screen.getByTestId('role-state').textContent).toBe('unauthenticated');
    });
    expect(screen.getByTestId('user-uid').textContent).toBe('null');
  });

  it('clearError removes error state', async () => {
    vi.mocked(signInWithEmail).mockRejectedValue({
      code: 'auth/wrong-password',
      message: 'Wrong password',
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    const callback = vi.mocked(observeAuthState).mock.calls[0]![0]!;
    callback(null);

    await screen.findByText('sign-in').then((btn) => btn.click());

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Wrong password');
    });

    await screen.findByText('clear-error').then((btn) => btn.click());
    expect(screen.getByTestId('error').textContent).toBe('null');
  });

  it('unsubscribe is called on unmount', () => {
    const { unmount } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
