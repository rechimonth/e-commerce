/**
 * Tipos del carrito de compras.
 *
 * CartState.items está persistido en localStorage para recuperar entre sesiones.
 * El cartReducer (en store/reducers/cartReducer.ts) consume CartAction.
 */
import type { Product, ProductImage } from './domain';
import type { Money } from './pricing';

export interface CartItem {
  readonly productId: string;
  readonly name: string;
  readonly price: Money;
  readonly quantity: number;
  readonly image: ProductImage;
  readonly maxStock: number;
}

export interface CartState {
  readonly items: readonly CartItem[];
  readonly discount: Money;
  readonly totalItems: number;
  readonly totalPrice: Money;
  readonly lastUpdated: Date;
}

export type CartAction =
  | { readonly type: 'ADD_ITEM'; readonly product: Product; readonly quantity: number }
  | { readonly type: 'REMOVE_ITEM'; readonly productId: string }
  | { readonly type: 'UPDATE_QUANTITY'; readonly productId: string; readonly quantity: number }
  | { readonly type: 'APPLY_DISCOUNT'; readonly discount: Money }
  | { readonly type: 'REMOVE_DISCOUNT' }
  | { readonly type: 'CLEAR_CART' }
  | { readonly type: 'HYDRATE'; readonly state: CartState };

export interface CartTotals {
  readonly subtotal: Money;
  readonly tax: Money;
  readonly shipping: Money;
  readonly discount: Money;
  readonly total: Money;
}
