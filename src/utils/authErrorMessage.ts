import type { ServiceError } from '@/types/api';

export type AuthErrorContext = 'login' | 'register';

/**
 * Converts Firebase/Auth and Firestore errors into safe, actionable Spanish copy.
 * Never surface raw provider or database messages directly to customers.
 */
export function getAuthErrorMessage(
  error: ServiceError,
  context: AuthErrorContext = 'login',
): string {
  const detail = (error.message ?? '').toLowerCase();

  if (detail.includes('auth/account-exists-with-different-credential')) {
    return 'Ya existe una cuenta con ese correo usando otro método de acceso. Inicia sesión con el método original; no necesitas crear otra cuenta.';
  }
  if (
    detail.includes('auth/email-already-in-use') ||
    detail.includes('auth/credential-already-in-use') ||
    (context === 'register' && error.code === 'CONFLICT')
  ) {
    return 'Ya existe una cuenta con ese correo. Inicia sesión con ella o utiliza el método con el que te registraste originalmente.';
  }
  if (detail.includes('auth/unauthorized-domain') || detail.includes('unauthorized domain')) {
    return 'Este dominio no está autorizado para iniciar sesión. El administrador debe agregar el dominio actual en Firebase Console → Authentication → Settings → Authorized domains.';
  }
  if (detail.includes('auth/operation-not-allowed')) {
    return 'El método de acceso elegido está deshabilitado en Firebase. El administrador debe habilitar Google o Email/Password, según corresponda, en Authentication → Sign-in method.';
  }
  if (detail.includes('auth/invalid-api-key') || detail.includes('firebase configuration missing')) {
    return 'La configuración de Firebase de la tienda está incompleta o no es válida. El administrador debe revisar las variables VITE_FIREBASE_* del entorno de producción.';
  }
  if (
    detail.includes('firestore/permission-denied') ||
    detail.includes('missing or insufficient permissions')
  ) {
    return 'La autenticación se inició, pero Firestore rechazó el perfil de cliente. El administrador debe revisar las reglas desplegadas para users/{uid}. No crees otra cuenta.';
  }
  if (detail.includes('auth/popup-blocked') || detail.includes('auth/operation-not-supported-in-this-environment')) {
    return 'El navegador bloqueó la ventana de Google. Vuelve a intentarlo; la tienda cambiará a un acceso por redirección cuando sea posible.';
  }
  if (detail.includes('auth/popup-closed-by-user') || detail.includes('auth/cancelled-popup-request')) {
    return 'El inicio de sesión con Google se canceló antes de terminar. Vuelve a intentarlo y elige tu cuenta.';
  }
  if (detail.includes('auth/weak-password')) {
    return 'La contraseña es demasiado débil. Utiliza al menos 6 caracteres y vuelve a intentarlo.';
  }
  if (detail.includes('auth/invalid-email')) {
    return 'El correo electrónico no tiene un formato válido.';
  }
  if (
    detail.includes('auth/invalid-credential') ||
    detail.includes('auth/invalid-login-credentials') ||
    detail.includes('auth/wrong-password') ||
    detail.includes('auth/user-not-found')
  ) {
    return context === 'register'
      ? 'No se pudo validar el acceso. Si ya tienes una cuenta, vuelve a Iniciar sesión.'
      : 'El correo o la contraseña no son correctos.';
  }
  if (detail.includes('auth/network-request-failed') || error.code === 'NETWORK_ERROR') {
    return 'No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.';
  }
  if (error.code === 'NOT_FOUND') {
    return 'No encontramos el perfil de esta cuenta. Vuelve a intentarlo; si el problema persiste, contacta al administrador.';
  }
  if (error.code === 'VALIDATION_ERROR') {
    return context === 'register'
      ? 'Revisa el correo y la contraseña. La contraseña debe tener al menos 6 caracteres.'
      : 'Revisa los datos ingresados e inténtalo de nuevo.';
  }
  if (detail.includes('database is closing/hidden')) {
    return 'La conexión con la base de datos se cerró. Recarga la página e inténtalo de nuevo.';
  }
  if (detail.includes('firestore/') || detail.includes('database')) {
    return 'No pudimos guardar o recuperar el perfil de cliente. Vuelve a intentarlo con la misma cuenta; si persiste, contacta al administrador.';
  }
  return context === 'register'
    ? 'No se pudo crear la cuenta. Vuelve a intentarlo con el mismo método de acceso; si el error continúa, contacta al administrador.'
    : 'No se pudo completar el inicio de sesión. Inténtalo de nuevo en unos momentos.';
}
