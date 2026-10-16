import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/infrastructure/firebase/config';
import { useAuth } from '@/hooks/useAuth';

interface FavoritesContextValue {
  readonly favoriteIds: readonly string[];
  readonly favoriteCount: number;
  readonly isFavorite: (productId: string) => boolean;
  readonly toggleFavorite: (productId: string) => Promise<void>;
}
const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);
const EMPTY_FAVORITES: string[] = [];
const FAVORITES_CONTEXT_UNAVAILABLE: FavoritesContextValue = {
  favoriteIds: EMPTY_FAVORITES,
  favoriteCount: 0,
  isFavorite: () => false,
  toggleFavorite: async () => { throw new Error('FavoritesProvider is not mounted.'); },
};

export function FavoritesProvider({ children }: { readonly children: ReactNode }) {
  const { user, roleState } = useAuth();
  const uid = roleState === 'admin' || roleState === 'customer' ? user?.uid ?? null : null;
  const [favoriteState, setFavoriteState] = useState<{ uid: string | null; ids: string[] }>({ uid: null, ids: [] });
  // Never expose the previous account's favorites during an auth/session transition.
  const favoriteIds = favoriteState.uid === uid ? favoriteState.ids : EMPTY_FAVORITES;
  const [notice, setNotice] = useState<string | null>(null);
  const activeUid = useRef<string | null>(null);
  const pending = useRef(new Set<string>());

  useEffect(() => {
    activeUid.current = uid;
    pending.current.clear();
    if (!uid) {
      setFavoriteState({ uid: null, ids: [] });
      setNotice(null);
      return;
    }
    let active = true;
    setFavoriteState({ uid, ids: [] });
    getDocs(collection(getFirebaseDb(), 'users', uid, 'favorites'))
      .then((snapshot) => {
        if (!active) return;
        const sorted = snapshot.docs
          .map((item) => ({ id: item.id, createdAt: item.data().createdAt?.toMillis?.() ?? 0 }))
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((item) => item.id);
        setFavoriteState({ uid, ids: sorted });
      })
      .catch(() => {
        if (active) setNotice('No se pudieron cargar tus favoritos. Comprueba tu conexión e inténtalo otra vez.');
      });
    return () => { active = false; };
  }, [uid]);

  const isFavorite = useCallback((productId: string) => favoriteIds.includes(productId), [favoriteIds]);
  const toggleFavorite = useCallback(async (productId: string) => {
    if (!uid || activeUid.current !== uid) throw new Error('Inicia sesión para administrar tus favoritos.');
    if (!productId || pending.current.has(productId)) return;
    pending.current.add(productId);
    const wasFavorite = favoriteIds.includes(productId);
    try {
      const favoriteRef = doc(getFirebaseDb(), 'users', uid, 'favorites', productId);
      if (wasFavorite) await deleteDoc(favoriteRef);
      else await setDoc(favoriteRef, { productId, createdAt: serverTimestamp() });
      if (activeUid.current === uid) {
        setFavoriteState((current) => current.uid !== uid ? current : { uid, ids: wasFavorite ? current.ids.filter((id) => id !== productId) : [productId, ...current.ids.filter((id) => id !== productId)] });
        setNotice(wasFavorite ? 'Producto eliminado de Favoritos.' : '¡Producto agregado a Favoritos!');
      }
    } catch {
      if (activeUid.current === uid) setNotice('No se pudo guardar el cambio en Favoritos. Inténtalo nuevamente.');
      throw new Error('No se pudo actualizar Favoritos en Firestore.');
    } finally {
      pending.current.delete(productId);
    }
  }, [uid, favoriteIds]);

  const value = useMemo(() => ({ favoriteIds, favoriteCount: favoriteIds.length, isFavorite, toggleFavorite }), [favoriteIds, isFavorite, toggleFavorite]);
  return <FavoritesContext.Provider value={value}>
    {children}
    {notice && <div role="status" aria-live="polite" className="fixed bottom-24 right-5 z-[100] max-w-[calc(100vw-2.5rem)] rounded-xl border border-fuchsia-300/30 bg-slate-950/95 px-4 py-3 text-sm font-semibold text-fuchsia-100 shadow-xl backdrop-blur">{notice}<button type="button" className="ml-3 text-slate-400 hover:text-white" aria-label="Cerrar aviso" onClick={() => setNotice(null)}>×</button></div>}
  </FavoritesContext.Provider>;
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  // Standalone component tests and isolated previews can render without the app provider.
  // The real application mounts FavoritesProvider around every route.
  return value ?? FAVORITES_CONTEXT_UNAVAILABLE;
}
