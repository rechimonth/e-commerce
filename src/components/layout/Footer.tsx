import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export function Footer() {
  return (
    <footer className="border-t border-cyan-400/20 bg-[#070914]/95 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link to={ROUTES.HOME} className="font-display text-xl font-black tracking-[0.16em] text-cyan-300">
            ECOMMERCE <span className="text-fuchsia-400">AI</span>
          </Link>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
            Un catálogo geek con videojuegos, figuras de acción y zapatillas. Explora, compara y arma tu próximo pedido.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-cyan-500/80">Sistema online · Buenos productos · Compra simple</p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">Navegación</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <Link className="transition hover:text-cyan-300" to={ROUTES.HOME}>Inicio</Link>
            <Link className="transition hover:text-cyan-300" to={ROUTES.CATALOG}>Catálogo</Link>
            <Link className="transition hover:text-cyan-300" to={ROUTES.CART}>Carrito</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">Ayuda</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <a className="transition hover:text-fuchsia-300" href="mailto:soporte@ecommerce-ai.example">Contacto</a>
            <span>Envíos y entregas</span>
            <span>Cambios y devoluciones</span>
            <span>Términos y privacidad</span>
          </div>
        </div>
      </div>
      <div className="border-t border-cyan-400/10 px-4 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ECOMMERCE AI · Proyecto Integrador 5
      </div>
    </footer>
  );
}

export default Footer;
