import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage } from '@/utils/authErrorMessage';
import type { ServiceError } from '@/types/api';

const serviceError = (code: ServiceError['code'], message: string): ServiceError => ({ code, message });

describe('getAuthErrorMessage', () => {
  it('explains an existing account registered with a different provider', () => {
    expect(getAuthErrorMessage(
      serviceError('INTERNAL_ERROR', 'Firebase: Error (auth/account-exists-with-different-credential).'),
      'register',
    )).toContain('método original');
  });

  it('guides administrators when the production domain is not authorized', () => {
    expect(getAuthErrorMessage(
      serviceError('FORBIDDEN', 'Firebase: Error (auth/unauthorized-domain).'),
      'login',
    )).toContain('Authorized domains');
  });

  it('does not expose raw Firestore permission errors to customers', () => {
    const message = getAuthErrorMessage(
      serviceError('FORBIDDEN', 'FirebaseError: Missing or insufficient permissions.'),
      'register',
    );
    expect(message).toContain('perfil de cliente');
    expect(message).not.toContain('FirebaseError');
  });
});
