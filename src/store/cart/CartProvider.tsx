/**
 * CartProvider — provee el estado del carrito a la app.
 *
 * Usa useReducer con inicialización lazy (restaura desde localStorage).
 * Persiste cambios al localStorage vía useEffect.
 * Los callbacks están memoizados para mantener referencias estables.
 *
 * NO usa React Context directamente en consumidores — ellos usan useCart().
 */
import { useReducer, useEffect, useMemo, useCallback } from 'react';
import { cartReducer, createInitialCartState } from '@/utils/cart/cartUtils';
import {
  loadCartFromStorage,
  saveCartToStorage,
  clearCartFromStorage,
} from '@/store/cart/persistence';
import { CartContext } from '@/store/cart/CartContext';
import type { CartState } from '@/types/cart';
import type { Product } from '@/types/domain';
import type { ReactNode } from 'react';

function initCartState(): CartState {
  const restored = loadCartFromStorage();
  return restored ?? createInitialCartState();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, initCartState);

  useEffect(() => {
    if (state.items.length > 0) {
      saveCartToStorage(state);
    } else {
      clearCartFromStorage();
    }
  }, [state]);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    dispatch({ type: 'ADD_ITEM', product, quantity });
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

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
