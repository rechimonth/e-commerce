import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { ROUTES } from '@/constants/routes';

const categories = [
  { id: 'video-games', label: 'Videojuegos', code: '01', icon: '▣', description: 'Consolas, juegos y accesorios para tu setup.' },
  { id: 'action-figures', label: 'Figuras de acción', code: '02', icon: '◈', description: 'Coleccionables para darle vida a tu estantería.' },
  { id: 'shoes', label: 'Zapatillas', code: '03', icon: '◇', description: 'Modelos deportivos para moverte con estilo.' },
];

export function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:pt-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="cyber-kicker">SISTEMA ONLINE // ECOMMERCE_AI</p>
                <h1 className="mt-5 max-w-4xl font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Tu próxima <span className="text-cyan-300 drop-shadow-[0_0_22px_rgba(34,211,238,0.55)]">colección</span> está aquí.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-7 text-slate-300 sm:text-xl">
                  Explora videojuegos, figuras de acción y zapatillas. Busca lo que quieres, filtra el catálogo y arma tu pedido sin vueltas.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to={ROUTES.CATALOG}>
                    <Button variant="solid" size="lg" className="w-full border border-cyan-300/40 bg-cyan-400 font-display uppercase tracking-wider text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-300 sm:w-auto">
                      Explorar catálogo
                    </Button>
                  </Link>
                  <Link to={ROUTES.CART}>
                    <Button variant="outline" size="lg" className="w-full border-fuchsia-400/40 bg-transparent font-display uppercase tracking-wider text-fuchsia-200 hover:bg-fuchsia-400/10 sm:w-auto">
                      Ver carrito
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative hidden min-h-[360px] lg:block">
                <div className="absolute inset-8 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="cyber-panel relative flex h-full min-h-[360px] items-center justify-center overflow-hidden rounded-2xl p-8">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_45%,rgba(34,211,238,0.08)_46%,transparent_47%),linear-gradient(315deg,transparent_45%,rgba(244,114,182,0.08)_46%,transparent_47%)] bg-[length:48px_48px]" />
                  <div className="relative text-center">
                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl border border-cyan-300/50 bg-cyan-300/10 font-display text-4xl font-black text-cyan-300 shadow-[0_0_55px_rgba(34,211,238,0.25)]">
                      AI
                    </div>
                    <p className="mt-6 font-display text-sm uppercase tracking-[0.35em] text-white">ACCESS GRANTED</p>
                    <p className="mt-2 text-sm text-slate-400">Gaming · Collectibles · Sneakers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="cyber-kicker">CATÁLOGO // SECTORES</p>
                <h2 className="mt-2 font-display text-2xl font-bold uppercase text-white sm:text-3xl">Elige tu zona</h2>
              </div>
              <Link to={ROUTES.CATALOG} className="hidden text-sm font-bold uppercase tracking-wider text-cyan-300 hover:text-white sm:block">Ver todo →</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`${ROUTES.CATALOG}?category=${category.id}`}
                  className="cyber-panel group rounded-xl p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-[0_0_32px_rgba(34,211,238,0.12)]"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-display text-3xl text-cyan-300 transition group-hover:text-fuchsia-300">{category.icon}</span>
                    <span className="font-display text-xs text-slate-600">{category.code}</span>
                  </div>
                  <h3 className="mt-10 font-display text-lg font-bold uppercase text-white">{category.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{category.description}</p>
                  <span className="mt-5 inline-block text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Entrar al sector →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default HomePage;
