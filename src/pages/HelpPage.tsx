import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

type HelpPageKey = 'contact' | 'shipping' | 'returns' | 'terms';

const pages: Record<HelpPageKey, { title: string; intro: string; sections: { heading: string; body: string }[] }> = {
  contact: {
    title: 'Contacto',
    intro: 'Estamos para ayudarte con tus consultas sobre productos, pedidos y el funcionamiento de la tienda.',
    sections: [
      { heading: 'Consultas sobre pedidos', body: 'Si ya realizaste una compra y tienes una cuenta, inicia sesión y entra en “Mis pedidos” para consultar el estado y los detalles de tu orden.' },
      { heading: 'Productos y disponibilidad', body: 'Puedes revisar las características y la disponibilidad actual de cada artículo desde el catálogo y su ficha de producto.' },
      { heading: 'Canales de contacto', body: 'Actualmente la tienda no tiene un correo electrónico ni un teléfono de atención configurados para publicar aquí. No queremos mostrar datos de contacto que no estén verificados.' },
    ],
  },
  shipping: {
    title: 'Envíos y entregas',
    intro: 'La información de entrega debe confirmarse según el pedido y el destino indicado durante el proceso de compra.',
    sections: [
      { heading: 'Destino y datos de entrega', body: 'Revisa que la dirección y los datos de contacto sean correctos antes de confirmar el pedido. Los errores u omisiones pueden dificultar la entrega.' },
      { heading: 'Plazos y costos', body: 'Los plazos y costos de envío no están configurados como una tarifa logística en esta versión de la tienda. No se debe asumir un plazo o importe hasta que se informe expresamente.' },
      { heading: 'Seguimiento', body: 'Cuando haya información de seguimiento disponible, consulta el detalle de la orden desde la sección “Mis pedidos”.' },
    ],
  },
  returns: {
    title: 'Cambios y devoluciones',
    intro: 'Queremos que cualquier solicitud relacionada con un producto se gestione con información clara sobre el pedido y su estado.',
    sections: [
      { heading: 'Antes de solicitar un cambio', body: 'Conserva el comprobante y los datos de la orden. Describe el producto, el motivo de la solicitud y si el artículo presenta algún defecto o llegó en condiciones distintas a las esperadas.' },
      { heading: 'Cómo iniciar una consulta', body: 'Revisa la orden en “Mis pedidos”. La tienda aún no tiene un flujo automatizado de cambios o devoluciones ni un canal de contacto publicado; por eso, esta página no promete una autorización o un plazo de resolución que no esté configurado.' },
      { heading: 'Derechos del consumidor', body: 'Esta información general no limita los derechos que correspondan según la normativa de defensa del consumidor aplicable. Las condiciones concretas deben evaluarse según la operación y la legislación vigente.' },
    ],
  },
  terms: {
    title: 'Términos y privacidad',
    intro: 'Estas pautas explican el uso básico de ECOMMERCE AI. Deben leerse junto con la información mostrada en cada operación.',
    sections: [
      { heading: 'Uso de la tienda', body: 'Utiliza el sitio de forma lícita y proporciona datos correctos al crear una cuenta, administrar tu carrito o realizar un pedido. La disponibilidad de los productos puede cambiar.' },
      { heading: 'Pedidos y pagos', body: 'En la versión actual, el checkout es simulado: no procesa cobros reales mediante una pasarela de pago. Una confirmación visual de la aplicación no equivale a un cargo bancario.' },
      { heading: 'Datos personales', body: 'La aplicación utiliza Firebase Authentication para gestionar la identidad y Firestore para guardar datos funcionales como perfiles, carritos, productos y órdenes. No publiques contraseñas ni datos sensibles en campos de texto.' },
      { heading: 'Seguridad y privacidad', body: 'El acceso a las funciones de la cuenta y a los pedidos depende de la autenticación y de los permisos configurados. Ningún sistema conectado a Internet puede garantizar seguridad absoluta; evita compartir credenciales y cierra sesión en dispositivos compartidos.' },
      { heading: 'Cambios de estas condiciones', body: 'El contenido de esta página es informativo y debe actualizarse cuando la tienda defina condiciones comerciales, canales de atención y una política formal de privacidad. La normativa aplicable prevalece sobre este resumen.' },
    ],
  },
};

function getPageKey(pathname: string): HelpPageKey {
  if (pathname === ROUTES.CONTACT) return 'contact';
  if (pathname === ROUTES.SHIPPING) return 'shipping';
  if (pathname === ROUTES.RETURNS) return 'returns';
  return 'terms';
}

export default function HelpPage() {
  const { pathname } = useLocation();
  const page = pages[getPageKey(pathname)];

  return (
    <main className="min-h-[60vh] bg-[#070914] px-4 py-12 text-slate-200 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-slate-400">
          <Link to={ROUTES.HOME} className="transition hover:text-cyan-300">Inicio</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="text-cyan-300">Ayuda</span>
        </nav>
        <header className="mb-10 border-b border-cyan-400/20 pb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">Centro de ayuda</p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{page.title}</h1>
          <p className="mt-4 text-base leading-7 text-slate-300">{page.intro}</p>
        </header>
        <div className="space-y-8">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-white">{section.heading}</h2>
              <p className="mt-2 leading-7 text-slate-400">{section.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-3 border-t border-cyan-400/20 pt-8">
          <Link to={ROUTES.CATALOG} className="rounded-lg bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">Ver catálogo</Link>
          <Link to={ROUTES.HOME} className="rounded-lg border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300 hover:text-cyan-300">Volver al inicio</Link>
        </div>
      </article>
    </main>
  );
}
