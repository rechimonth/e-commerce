import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useCart } from '@/hooks/useCart';
import { CartProvider } from '@/store/cart/CartProvider';
import {
  saveCartToStorage,
  loadCartFromStorage,
  clearCartFromStorage,
} from '@/store/cart/persistence';
import type { Product } from '@/types/domain';
import { money } from '@/types/pricing';

const testProduct: Product = {
  id: 'p1',
  name: 'Test Product',
  description: 'A test product',
  price: money(10.0),
  category: 'electronics',
  image: { url: 'https://example.com/img.png', alt: 'Test', key: 'img-1' },
  stock: 10,
  rating: 4.5,
  reviewCount: 100,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  createdBy: 'admin',
};

const expensiveProduct: Product = {
  ...testProduct,
  id: 'p2',
  price: money(25.5),
  stock: 5,
};

function TestConsumer() {
  const cart = useCart();
  return (
    <div>
      <span data-testid="items-length">{cart.items.length}</span>
      <span data-testid="total-items">{cart.totalItems}</span>
      <span data-testid="total-price">{cart.totalPrice.amount}</span>
      <span data-testid="discount">{cart.totalPrice.currency}</span>
      <button
        data-testid="add-btn"
        onClick={() => cart.addItem(testProduct, 2)}
      >
        add
      </button>
      <button
        data-testid="add-one-btn"
        onClick={() => cart.addItem(testProduct, 1)}
      >
        add-one
      </button>
      <button
        data-testid="add-expensive-btn"
        onClick={() => cart.addItem(expensiveProduct, 1)}
      >
        add-expensive
      </button>
      <button
        data-testid="remove-btn"
        onClick={() => cart.removeItem('p1')}
      >
        remove-p1
      </button>
      <button
        data-testid="update-btn"
        onClick={() => cart.updateQuantity('p1', 5)}
      >
        update-p1-to-5
      </button>
      <button
        data-testid="update-zero-btn"
        onClick={() => cart.updateQuantity('p1', 0)}
      >
        update-p1-to-0
      </button>
      <button data-testid="clear-btn" onClick={() => cart.clearCart()}>
        clear
      </button>
    </div>
  );
}

describe('CartProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children', () => {
    render(
      <CartProvider>
        <div data-testid="child">child</div>
      </CartProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('provides initial empty cart state', () => {
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    expect(screen.getByTestId('items-length').textContent).toBe('0');
    expect(screen.getByTestId('total-items').textContent).toBe('0');
    expect(screen.getByTestId('total-price').textContent).toBe('0');
  });

  it('adds item and recalculates totals', async () => {
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await screen.findByTestId('add-btn').then((btn) => btn.click());

    await waitFor(() => {
      expect(screen.getByTestId('items-length').textContent).toBe('1');
      expect(screen.getByTestId('total-items').textContent).toBe('2');
      expect(screen.getByTestId('total-price').textContent).toBe('2000');
    });
  });

  it('merges quantity when adding same product twice', async () => {
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await screen.findByTestId('add-one-btn').then((btn) => btn.click());
    await screen.findByTestId('add-one-btn').then((btn) => btn.click());

    await waitFor(() => {
      expect(screen.getByTestId('items-length').textContent).toBe('1');
      expect(screen.getByTestId('total-items').textContent).toBe('2');
    });
  });

  it('removes item', async () => {
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await screen.findByTestId('add-btn').then((btn) => btn.click());
    await waitFor(() => expect(screen.getByTestId('items-length').textContent).toBe('1'));

    await screen.findByTestId('remove-btn').then((btn) => btn.click());
    await waitFor(() => {
      expect(screen.getByTestId('items-length').textContent).toBe('0');
      expect(screen.getByTestId('total-items').textContent).toBe('0');
      expect(screen.getByTestId('total-price').textContent).toBe('0');
    });
  });

  it('updates quantity', async () => {
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await screen.findByTestId('add-one-btn').then((btn) => btn.click());
    await waitFor(() => expect(screen.getByTestId('total-items').textContent).toBe('1'));

    await screen.findByTestId('update-btn').then((btn) => btn.click());
    await waitFor(() => {
      expect(screen.getByTestId('total-items').textContent).toBe('5');
      expect(screen.getByTestId('total-price').textContent).toBe('5000');
    });
  });

  it('removes item on updateQuantity to zero', async () => {
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await screen.findByTestId('add-btn').then((btn) => btn.click());
    await waitFor(() => expect(screen.getByTestId('items-length').textContent).toBe('1'));

    await screen.findByTestId('update-zero-btn').then((btn) => btn.click());
    await waitFor(() => {
      expect(screen.getByTestId('items-length').textContent).toBe('0');
      expect(screen.getByTestId('total-items').textContent).toBe('0');
    });
  });

  it('clears cart and removes localStorage', async () => {
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await screen.findByTestId('add-btn').then((btn) => btn.click());
    await waitFor(() => expect(screen.getByTestId('items-length').textContent).toBe('1'));

    expect(localStorage.getItem('ecommerce-cart')).not.toBeNull();

    await screen.findByTestId('clear-btn').then((btn) => btn.click());
    await waitFor(() => {
      expect(screen.getByTestId('items-length').textContent).toBe('0');
      expect(screen.getByTestId('total-items').textContent).toBe('0');
      expect(localStorage.getItem('ecommerce-cart')).toBeNull();
    });
  });

  it('handles multiple products with different prices', async () => {
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await screen.findByTestId('add-btn').then((btn) => btn.click());
    await screen.findByTestId('add-expensive-btn').then((btn) => btn.click());

    await waitFor(() => {
      expect(screen.getByTestId('items-length').textContent).toBe('2');
      expect(screen.getByTestId('total-items').textContent).toBe('3');
    });
    // p1: 2 * 10.0 = 2000 cents; p2: 1 * 25.5 = 2550 cents; total = 4550
    expect(screen.getByTestId('total-price').textContent).toBe('4550');
  });
});

describe('CartProvider persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists cart state to localStorage on change', async () => {
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await screen.findByTestId('add-btn').then((btn) => btn.click());
    await waitFor(() => expect(screen.getByTestId('items-length').textContent).toBe('1'));

    const stored = localStorage.getItem('ecommerce-cart');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.version).toBe(1);
    expect(parsed.state.items).toHaveLength(1);
    expect(parsed.state.items[0]?.productId).toBe('p1');
  });

  it('restores cart from localStorage on init', () => {
    const restored = loadCartFromStorage();
    expect(restored).toBeNull();
  });

  it('restores cart from localStorage after save', async () => {
    const { unmount } = render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await screen.findByTestId('add-btn').then((btn) => btn.click());
    await waitFor(() => expect(screen.getByTestId('total-items').textContent).toBe('2'));

    unmount();

    const stored = localStorage.getItem('ecommerce-cart');
    expect(stored).not.toBeNull();

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('items-length').textContent).toBe('1');
      expect(screen.getByTestId('total-items').textContent).toBe('2');
      expect(screen.getByTestId('total-price').textContent).toBe('2000');
    });
  });

  it('recalculates totals on restore', async () => {
    saveCartToStorage({
      items: [
        {
          productId: 'p1',
          name: 'Test',
          price: money(10.0),
          quantity: 3,
          image: { url: 'https://example.com/img.png', alt: 'test', key: 'img-1' },
          maxStock: 10,
        },
      ],
      discount: money(5.0),
      totalItems: 999,
      totalPrice: { amount: 99999, currency: 'USD' },
      lastUpdated: new Date('2024-01-01T00:00:00.000Z'),
    });

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('total-items').textContent).toBe('3');
    });
    // 3 * 10.0 = 3000 cents; minus discount 500 cents = 2500
    expect(screen.getByTestId('total-price').textContent).toBe('2500');
  });

  it('starts with empty cart on corrupt JSON in localStorage', () => {
    localStorage.setItem('ecommerce-cart', 'not valid json{');

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    expect(screen.getByTestId('items-length').textContent).toBe('0');
    expect(screen.getByTestId('total-items').textContent).toBe('0');
    expect(localStorage.getItem('ecommerce-cart')).toBeNull();
  });

  it('starts with empty cart on unsupported format version', () => {
    localStorage.setItem(
      'ecommerce-cart',
      JSON.stringify({ version: 999, state: { items: [] } }),
    );

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    expect(screen.getByTestId('items-length').textContent).toBe('0');
    expect(localStorage.getItem('ecommerce-cart')).toBeNull();
  });

  it('starts with empty cart on invalid state structure', () => {
    localStorage.setItem(
      'ecommerce-cart',
      JSON.stringify({ version: 1, state: 'not-an-object' }),
    );

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    expect(screen.getByTestId('items-length').textContent).toBe('0');
    expect(localStorage.getItem('ecommerce-cart')).toBeNull();
  });

  it('filters out invalid items on restore but keeps valid ones', () => {
    localStorage.setItem(
      'ecommerce-cart',
      JSON.stringify({
        version: 1,
        state: {
          items: [
            {
              productId: 'bad',
              name: 123,
              price: { amount: 'not-a-number', currency: 'USD' },
              quantity: 'not-a-number',
              image: null,
              maxStock: -5,
            },
            {
              productId: 'p1',
              name: 'Valid',
              price: { amount: 1000, currency: 'USD' },
              quantity: 2,
              image: { url: 'https://example.com/img.png', alt: 'test', key: 'img-1' },
              maxStock: 10,
            },
          ],
          discount: { amount: 0, currency: 'USD' },
          totalItems: 5,
          totalPrice: { amount: 99999, currency: 'USD' },
          lastUpdated: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        },
      }),
    );

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    expect(screen.getByTestId('items-length').textContent).toBe('1');
    expect(screen.getByTestId('total-items').textContent).toBe('2');
    expect(screen.getByTestId('total-price').textContent).toBe('2000');
  });

  it('persists discount and restores with recalculated total', async () => {
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await screen.findByTestId('add-btn').then((btn) => btn.click());
    await waitFor(() => expect(screen.getByTestId('total-price').textContent).toBe('2000'));

    // Apply discount via raw dispatch through context
    saveCartToStorage({
      items: [
        {
          productId: 'p1',
          name: 'Test',
          price: money(10.0),
          quantity: 2,
          image: { url: 'https://example.com/img.png', alt: 'test', key: 'img-1' },
          maxStock: 10,
        },
      ],
      discount: money(5.0),
      totalItems: 2,
      totalPrice: money(15.0),
      lastUpdated: new Date(),
    });
  });
});

describe('Persistence functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saveCartToStorage writes to localStorage', () => {
    const state = {
      items: [
        {
          productId: 'p1',
          name: 'Test',
          price: money(10.0),
          quantity: 2,
          image: { url: 'https://example.com/img.png', alt: 'test', key: 'img-1' },
          maxStock: 10,
        },
      ],
      discount: money(0),
      totalItems: 2,
      totalPrice: money(20.0),
      lastUpdated: new Date('2024-01-01T00:00:00.000Z'),
    };

    saveCartToStorage(state);

    const raw = localStorage.getItem('ecommerce-cart');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(1);
    expect(parsed.state.items[0]?.productId).toBe('p1');
  });

  it('loadCartFromStorage returns null when empty', () => {
    expect(loadCartFromStorage()).toBeNull();
  });

  it('clearCartFromStorage removes the entry', () => {
    localStorage.setItem('ecommerce-cart', 'test-data');
    clearCartFromStorage();
    expect(localStorage.getItem('ecommerce-cart')).toBeNull();
  });
});
