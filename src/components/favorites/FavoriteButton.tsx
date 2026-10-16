import { useContext, useState } from 'react';
import { UNSAFE_LocationContext, UNSAFE_NavigationContext } from 'react-router';
import { AuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { useFavorites } from '@/contexts/FavoritesContext';

interface FavoriteButtonProps {
  readonly productId: string;
  readonly productName: string;
  readonly className?: string;
}
export function FavoriteButton({ productId, productName, className = '' }: FavoriteButtonProps) {
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const roleState = auth?.roleState ?? 'unauthenticated';
  const isLoading = auth?.isLoading ?? false;
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigation = useContext(UNSAFE_NavigationContext);
  const location = useContext(UNSAFE_LocationContext)?.location;
  const [busy, setBusy] = useState(false);
  const [popped, setPopped] = useState(false);
  const active = isFavorite(productId);
  const authenticated = Boolean(user && (roleState === 'customer' || roleState === 'admin'));
  const handleClick = async () => {
    if (isLoading || busy) return;
    if (!authenticated) {
      if (navigation && location) {
        navigation.navigator.push('/login', { from: location.pathname + location.search + location.hash });
      }
      return;
    }
    setBusy(true);
    try {
      await toggleFavorite(productId);
      setPopped(true);
      window.setTimeout(() => setPopped(false), 420);
    } catch {
      // FavoritesContext announces persistence failures without breaking the product card.
    } finally {
      setBusy(false);
    }
  };
  return <Button type="button" variant="ghost" size="sm" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void handleClick(); }}
    disabled={isLoading || busy} aria-label={active ? `Quitar ${productName} de Favoritos` : `Agregar ${productName} a Favoritos`}
    aria-pressed={active} title={active ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
    className={`!h-10 !min-h-10 !w-10 !p-0 inline-flex items-center justify-center rounded-full border border-white/15 bg-slate-950/80 text-slate-300 shadow-lg backdrop-blur transition duration-200 hover:scale-110 hover:border-fuchsia-300/60 hover:text-fuchsia-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 disabled:opacity-60 ${active ? 'text-fuchsia-400' : ''} ${popped ? 'scale-125' : ''} ${className}`}>
    <svg viewBox="0 0 24 24" width="20" height="20" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={popped ? 'animate-pulse' : 'transition-transform duration-200'} aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>
  </Button>;
}
