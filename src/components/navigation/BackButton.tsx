import { useLocation, useNavigate } from 'react-router-dom';

function getFallback(pathname: string): string {
  if (pathname.startsWith('/admin')) return '/admin';
  if (pathname.startsWith('/products/')) return '/catalog';
  if (pathname.startsWith('/orders/')) return '/orders';
  if (pathname === '/favorites') return '/catalog';
  if (pathname === '/cart' || pathname === '/checkout') return '/catalog';
  return '/';
}

export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => {
    const historyState = window.history.state as { idx?: number } | null;
    if (typeof historyState?.idx === 'number' && historyState.idx > 0 && location.key !== 'default') {
      navigate(-1);
      return;
    }
    navigate(getFallback(location.pathname));
  };
  return <button type="button" onClick={goBack} aria-label="Volver a la página anterior" title="Volver"
    className="fixed bottom-5 left-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/25 bg-slate-950/90 text-cyan-200 shadow-lg backdrop-blur transition hover:scale-105 hover:border-cyan-300/60 hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
  </button>;
}
