import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { ROUTES } from '@/constants/routes';

export function HomePage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl">E-Commerce</h1>
          <p className="mt-4 max-w-2xl text-neutral-600">
            Descubre productos de calidad seleccionados por nuestro asistente de IA.
            Compara precios, recibe recomendaciones personalizadas y completa tu compra
            en segundos.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={ROUTES.CATALOG}>
              <Button variant="solid" size="lg">
                Ver cat�logo
              </Button>
            </Link>
            <Link to={ROUTES.CART}>
              <Button variant="outline" size="lg">
                Ver carrito
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export default HomePage;
