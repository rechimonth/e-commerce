import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import type { AuthContextValue } from '@/contexts/AuthContext';
import { CartProvider } from '@/store/cart/CartProvider';
import { useCart } from '@/hooks/useCart';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage';
import { ROUTES } from '@/constants/routes';
import { orderFixture, productFixture, userCustomerFixture } from '@/test/fixtures';

const mocks = vi.hoisted(() => ({
  processCheckout: vi.fn(),
  fetchOrder: vi.fn(),
}));

vi.mock('@/services/checkoutService', () => ({
  checkoutService: { processCheckout: mocks.processCheckout },
}));

vi.mock('@/services/ordersService', () => ({
  ordersService: {
    fetchOrder: mocks.fetchOrder,
    fetchUserOrders: vi.fn().mockResolvedValue([]),
    cancelOrder: vi.fn(),
    fetchAllOrders: vi.fn(),
    updateOrderStatus: vi.fn(),
  },
}));

function CartHarness() {
  const { addItem, totalItems } = useCart();

  return (
    <div>
      <button type="button" onClick={() => addItem(productFixture, 1)}>
        Agregar producto de prueba
      </button>
      <output aria-label="Cantidad de artículos" data-testid="cart-count">
        {totalItems}
      </output>
    </div>
  );
}

const authValue = {
  user: userCustomerFixture,
  roleState: 'customer',
  session: { uid: userCustomerFixture.uid, role: 'customer', isAuthenticated: true },
  isLoading: false,
  error: null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  refreshUserProfile: vi.fn(),
  clearError: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue('test-token'),
} as unknown as AuthContextValue;

function renderCheckoutFlow() {
  return render(
    <AuthContext.Provider value={authValue}>
      <CartProvider>
        <MemoryRouter initialEntries={[ROUTES.CART]}>
          <CartHarness />
          <Routes>
            <Route path={ROUTES.CHECKOUT} element={<CheckoutPage />} />
            <Route path="/orders/:id/confirmation" element={<OrderConfirmationPage />} />
            <Route path="*" element={<div>Carrito de prueba</div>} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthContext.Provider>,
  );
}

describe('Flujo de integración carrito → checkout → confirmación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.processCheckout.mockResolvedValue(orderFixture);
    mocks.fetchOrder.mockResolvedValue(orderFixture);
  });

  it('agrega un producto, envía el checkout y vacía el carrito tras la confirmación', async () => {
    const user = userEvent.setup();
    renderCheckoutFlow();

    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: 'Agregar producto de prueba' }));

    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    expect(screen.getByText('Test Product')).toBeInTheDocument();

    // CheckoutPage is entered through the router so this test exercises the real
    // cart provider and form; only the remote checkout/Firestore boundary is mocked.
    window.history.pushState({}, '', ROUTES.CHECKOUT);
    await waitFor(() => expect(screen.getByRole('heading', { name: /completa tu pedido/i })).toBeInTheDocument());

    await user.type(screen.getByLabelText('Calle y número'), '123 Main Street');
    await user.type(screen.getByLabelText('Ciudad'), 'Buenos Aires');
    await user.type(screen.getByLabelText('Provincia / Estado'), 'Buenos Aires');
    await user.type(screen.getByLabelText('Código postal'), '1825');
    await user.type(screen.getByLabelText('País'), 'Argentina');
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }));

    await waitFor(() => expect(mocks.processCheckout).toHaveBeenCalledTimes(1));
    expect(mocks.processCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        shippingAddress: expect.objectContaining({ street: '123 Main Street', country: 'Argentina' }),
        paymentMethod: 'card',
      }),
      expect.objectContaining({
        items: [expect.objectContaining({ productId: productFixture.id, quantity: 1 })],
      }),
      userCustomerFixture.uid,
    );

    expect(await screen.findByText('¡Pedido confirmado!')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('0'));
  });

  it('mantiene el carrito cuando el servicio de checkout falla', async () => {
    const user = userEvent.setup();
    mocks.processCheckout.mockRejectedValueOnce(new Error('Stock insuficiente'));
    renderCheckoutFlow();

    await user.click(screen.getByRole('button', { name: 'Agregar producto de prueba' }));
    window.history.pushState({}, '', ROUTES.CHECKOUT);
    await waitFor(() => expect(screen.getByRole('heading', { name: /completa tu pedido/i })).toBeInTheDocument());

    await user.type(screen.getByLabelText('Calle y número'), '123 Main Street');
    await user.type(screen.getByLabelText('Ciudad'), 'Buenos Aires');
    await user.type(screen.getByLabelText('Provincia / Estado'), 'Buenos Aires');
    await user.type(screen.getByLabelText('Código postal'), '1825');
    await user.type(screen.getByLabelText('País'), 'Argentina');
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }));

    expect(await screen.findByText('Stock insuficiente')).toBeInTheDocument();
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    expect(mocks.fetchOrder).not.toHaveBeenCalled();
  });
});
