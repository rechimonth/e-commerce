/**
 * CartContext — separado de AuthContext para mantener responsabilidades aisladas.
 *
 * Define el contrato que expone el carrito a través de la app.
 * Los componentes NO consumen este contexto directamente; usan useCart().
 */
import { createContext } from 'react';
import type { CartItem } from '@/types/cart';
import type { Money } from '@/types/pricing';
import type { Product } from '@/types/domain';

export interface CartContextValue {
  readonly items: readonly CartItem[];
  readonly totalItems: number;
  readonly totalPrice: Money;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);
