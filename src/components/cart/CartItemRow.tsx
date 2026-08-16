/**
 * CartItemRow — fila de producto en el carrito.
 *
 * Componente presentacional: recibe los handlers como props.
 * No consume CartContext directamente.
 */
import { Price, QuantitySelector, Button } from '@/components/ui';
import type { CartItem } from '@/types/cart';

export interface CartItemRowProps {
  readonly item: CartItem;
  readonly onUpdateQuantity: (productId: string, quantity: number) => void;
  readonly onRemove: (productId: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const lineTotalCents = item.price.amount * item.quantity;

  return (
    <div className="flex items-center gap-4 py-4 sm:gap-6">
      <div className="flex-shrink-0">
        <img
          src={item.image.url}
          alt={item.image.alt}
          className="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-neutral-900 sm:text-base">{item.name}</h3>
        <p className="mt-1 text-sm text-neutral-500">
          <Price amount={item.price.amount} currency={item.price.currency} />
          {' '}
          x {item.quantity}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <QuantitySelector
          quantity={item.quantity}
          min={1}
          max={item.maxStock}
          onChange={(qty) => onUpdateQuantity(item.productId, qty)}
          buttonSize="sm"
        />
        <div className="w-20 text-right">
          <Price
            amount={lineTotalCents}
            currency={item.price.currency}
            className="font-bold"
          />
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onRemove(item.productId)}
          aria-label={`Eliminar ${item.name}`}
        >
          ×
        </Button>
      </div>
    </div>
  );
}

export default CartItemRow;
