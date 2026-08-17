import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user, roleState, error, signUp, signInWithGoogle, clearError } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && roleState !== 'loading') navigate(ROUTES.CATALOG, { replace: true });
  }, [user, roleState, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setValidationError(null);
    if (password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({ email: email.trim(), password, displayName: displayName.trim() });
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
            <h1 className="text-2xl font-bold text-neutral-900">Crear cuenta</h1>
            <p className="mt-2 text-sm text-neutral-600">Regístrate para comenzar a comprar.</p>
          </div>
          {(validationError || error) && (
            <Alert variant="error" title="No se pudo crear la cuenta" message={validationError ?? error?.message ?? 'Error de autenticación'} />
          )}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input label="Nombre" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Contraseña" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Input label="Confirmar contraseña" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs text-neutral-500">o</span>
            <span className="h-px flex-1 bg-neutral-200" />
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={submitting}>
            Registrarse con Google
          </Button>
          <p className="mt-6 text-center text-sm text-neutral-600">
            ¿Ya tienes una cuenta?{' '}
            <Link to={ROUTES.LOGIN} className="font-medium text-primary-600 hover:underline">Iniciar sesión</Link>
          </p>
        </Card>
      </Container>
    </>
  );
}
