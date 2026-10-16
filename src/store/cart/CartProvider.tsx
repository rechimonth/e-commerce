/**
 * CartProvider — provee el estado del carrito a la app.
 *
 * Usa useReducer con inicialización lazy desde la caché local.
 * Sincroniza carritos autenticados con Firestore y mantiene localStorage como fallback.
 * Los callbacks están memoizados para mantener referencias estables.
 *
 * NO usa React Context directamente en consumidores — ellos usan useCart().
 */
import { useReducer, useEffect, useMemo, useCallback, useContext, useState, useRef } from 'react';
import { cartReducer, createInitialCartState } from '@/utils/cart/cartUtils';
import {
  loadCartFromStorage,
  saveCartToStorage,
  clearCartFromStorage,
  getCartStorageKey,
} from '@/store/cart/persistence';
import { CartContext } from '@/store/cart/CartContext';
import { AuthContext } from '@/contexts/AuthContext';
import { loadCartFromCloud, saveCartToCloud } from '@/store/cart/cloudPersistence';
import type { CartState } from '@/types/cart';
import type { Product } from '@/types/domain';
import type { ReactNode } from 'react';

function initCartState(storageKey: string): CartState {
  const restored = loadCartFromStorage(storageKey);
  return restored ?? createInitialCartState();
}

function CartStateProvider({ children, storageKey, userId }: { children: ReactNode; storageKey: string; userId?: string }) {
  const [state, dispatch] = useReducer(cartReducer, storageKey, initCartState);
  const initialStateRef = useRef(state);
  const currentStateRef = useRef(state);
  currentStateRef.current = state;
  const [cloudReady, setCloudReady] = useState(!userId);
  const [cartNotice, setCartNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!cartNotice) return;
    const timeoutId = window.setTimeout(() => setCartNotice(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [cartNotice]);

  useEffect(() => {
    if (!userId) {
      setCloudReady(true);
      return;
    }

    let active = true;
    setCloudReady(false);
    void loadCartFromCloud(userId)
      .then((cloudState) => {
        const changedDuringHydration = currentStateRef.current !== initialStateRef.current;
        if (active && cloudState && !changedDuringHydration) {
          dispatch({ type: 'HYDRATE', state: cloudState });
        }
      })
      .catch(() => {
        // Keep the per-user local cache available if Firestore is temporarily unreachable.
      })
      .finally(() => {
        if (active) setCloudReady(true);
      });

    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (state.items.length > 0) {
      saveCartToStorage(state, storageKey);
    } else {
      clearCartFromStorage(storageKey);
    }

    if (userId && cloudReady) {
      void saveCartToCloud(userId, state).catch(() => {
        // localStorage remains the offline fallback; the next state change retries sync.
      });
    }
  }, [state, storageKey, userId, cloudReady]);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    if (!Number.isFinite(quantity) || quantity < 1 || product.stock < quantity) {
      setCartNotice(product.stock < 1 ? 'Este producto no tiene stock disponible.' : 'No hay suficientes unidades disponibles.');
      return;
    }

    dispatch({ type: 'ADD_ITEM', product, quantity });
    setCartNotice(`¡${product.name} se agregó correctamente al carrito!`);
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', productId });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const value = useMemo(() => {
    return {
      items: state.items,
      totalItems: state.totalItems,
      totalPrice: state.totalPrice,
      discount: state.discount,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    };
  }, [state.items, state.totalItems, state.totalPrice, state.discount, addItem, removeItem, updateQuantity, clearCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {cartNotice && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-5 right-5 z-[100] max-w-[calc(100vw-2.5rem)] rounded-xl border border-emerald-300/30 bg-slate-950/95 px-4 py-3 text-sm font-semibold text-emerald-200 shadow-[0_12px_35px_rgba(0,0,0,0.4)] backdrop-blur"
        >
          <span aria-hidden="true" className="mr-2 text-emerald-300">✓</span>
          {cartNotice}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.uid;
  const storageKey = getCartStorageKey(userId);
  return (
    <CartStateProvider key={storageKey} storageKey={storageKey} userId={userId}>
      {children}
    </CartStateProvider>
  );
}
