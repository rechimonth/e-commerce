import { useContext } from 'react';
import { CartContext } from '@/store/cart/CartContext';
import type { CartContextValue } from '@/store/cart/CartContext';

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
