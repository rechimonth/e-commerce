import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import type { ServiceError } from '@/types/api';

function getLoginErrorMessage(error: ServiceError): string {
  if (error.message.includes('Database is closing/hidden')) {
    return 'La conexión con la base de datos se cerró. Recarga la página e inténtalo de nuevo.';
  }

  switch (error.code) {
    case 'UNAUTHORIZED':
      return 'El correo o la contraseña no son correctos.';
    case 'NOT_FOUND':
      return 'No encontramos el perfil de esta cuenta. Contacta al administrador.';
    case 'NETWORK_ERROR':
      return 'No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.';
    case 'VALIDATION_ERROR':
      return 'Revisa el formato del correo electrónico e inténtalo de nuevo.';
    default:
      return 'No se pudo completar el inicio de sesión. Inténtalo de nuevo en unos momentos.';
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roleState, error, signIn, signInWithGoogle, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.CATALOG;

  useEffect(() => {
    if (user && roleState !== 'loading') navigate(from, { replace: true });
  }, [user, roleState, from, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    clearError();
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <Container as="main" className="flex min-h-[70vh] items-center justify-center py-10">
        <Card className="w-full max-w-md p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">Iniciar sesión</h1>
            <p className="mt-2 text-sm text-neutral-600">Accede a tu cuenta para continuar.</p>
          </div>
          {error && <Alert variant="error" title="No se pudo iniciar sesión" message={getLoginErrorMessage(error)} />}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" aria-busy={submitting}>
            <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && (
                <span
                  aria-hidden="true"
                  className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
              )}
              {submitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs text-neutral-500">o</span>
            <span className="h-px flex-1 bg-neutral-200" />
          </div>
          <Button type="button" variant="outline" className="w-full !text-black" onClick={handleGoogle} disabled={submitting}>
            Continuar con Google
          </Button>
          <p className="mt-6 text-center text-sm text-neutral-600">
            ¿No tienes una cuenta?{' '}
            <Link to={ROUTES.REGISTER} className="font-medium text-primary-600 hover:underline">Crear cuenta</Link>
          </p>
        </Card>
      </Container>
    </>
  );
}
