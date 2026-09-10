import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Price } from '@/components/ui/Price';
import { AdminOrderMiniCart } from '@/components/admin/AdminOrderMiniCart';
import { ROUTES } from '@/constants/routes';
import type { Product } from '@/types/domain';
import { checkoutService } from '@/services/checkoutService';
import type { CheckoutData } from '@/types/order';
import type { CartState } from '@/types/cart';
import { useAuth } from '@/hooks/useAuth';

type PaymentMethod = 'card' | 'paypal' | 'cash';
type CategoryFilter = '' | 'action-figures' | 'video-games' | 'shoes';

interface CartItem extends Product {
  readonly quantity: number;
}

interface Customer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'admin', name: 'ADMIN', email: 'admin@ecommerce.com' },
  { id: 'customer', name: 'CUSTOMER', email: 'customer@ecommerce.com' },
];

const PAYMENT_METHODS = [
  { value: 'card', label: 'Tarjeta de crédito/débito' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'cash', label: 'Efectivo contra entrega' },
];

const CATEGORY_FILTERS = [
  { value: '', label: 'Todas las categorías' },
  { value: 'action-figures', label: 'Action Figures' },
  { value: 'video-games', label: 'Video Games' },
  { value: 'shoes', label: 'Shoes' },
];

const TAX_RATE = 0.21;
const DEFAULT_ADDRESS = {
  street: 'Calle Principal 123',
  city: 'Ciudad',
  state: 'Provincia',
  zipCode: '12345',
  country: 'País',
};

export function AdminCreateOrderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCatalogOpen) return;
    let isMounted = true;
    setIsLoadingCatalog(true);
    setError(null);
    import('@/services/productsService')
      .then(({ productsService }) =>
        productsService.fetchProductsAdmin({
          limit: 100,
          category: selectedCategory || undefined,
        }),
      )
      .then((result) => {
        if (!isMounted) return;
        setCatalogProducts([...result.items]);
      })
      .catch(() => {
        if (!isMounted) return;
        setCatalogProducts([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingCatalog(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isCatalogOpen, selectedCategory]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
          : item,
      ),
    );
  }, []);

  const incrementQuantity = useCallback((productId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
          : item,
      ),
    );
  }, []);

  const decrementQuantity = useCallback((productId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item,
      ),
    );
  }, []);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price.amount * item.quantity, 0), [cart]);
  const tax = useMemo(() => subtotal * TAX_RATE, [subtotal]);
  const shipping = 0;
  const discount = 0;
  const total = useMemo(() => subtotal + tax + shipping - discount, [subtotal, tax]);
  const totalUnits = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const handleCreateOrder = async () => {
    if (!selectedCustomerId || cart.length === 0) return;
    if (!user) {
      setError('No hay sesión activa. Inicia sesión nuevamente.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const checkoutData: CheckoutData = {
        shippingAddress: DEFAULT_ADDRESS,
        billingAddress: DEFAULT_ADDRESS,
        paymentMethod,
      };
      const cartState: CartState = {
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          maxStock: item.stock,
        })),
        discount: { amount: 0, currency: 'USD' },
        totalItems: totalUnits,
        totalPrice: { amount: total, currency: 'USD' },
        lastUpdated: new Date(),
      };
      const order = await checkoutService.processCheckout(checkoutData, cartState, user.uid);
      if (!order) {
        setError('No pudimos crear la orden. Intenta nuevamente.');
        return;
      }
      alert('Orden creada exitosamente: ' + order.id);
      setCart([]);
      setSelectedCustomerId('');
      setPaymentMethod('card');
      setSelectedCategory('');
      setIsCatalogOpen(false);
      navigate(ROUTES.ADMIN_ORDERS);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al crear la orden';
      setError(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCustomer = MOCK_CUSTOMERS.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="cyber-kicker">ORDER CONSOLE</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Crear Orden</h1>
          <p className="mt-1 text-sm text-slate-400">Configura cliente, productos y pago desde un único flujo.</p>
        </div>
        <Link to={ROUTES.ADMIN_ORDERS}>
          <Button variant="outline" size="md">Volver a órdenes</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="cyber-card p-6">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="cyber-kicker">ORDER ITEMS</p>
                <h2 className="mt-1 text-lg font-bold text-white">Productos</h2>
              </div>
              <Button variant="solid" size="sm" onClick={() => setIsCatalogOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" x2="21" y1="6" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                Explorar Catálogo
              </Button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300/15 bg-slate-950/35 py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/5 text-cyan-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                </div>
                <p className="font-semibold text-slate-200">No hay productos seleccionados</p>
                <p className="mt-1 text-sm text-slate-400">Abre el catálogo para agregar productos a la orden.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-cyan-300/10">
                <table className="min-w-full">
                  <thead className="bg-slate-950/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cyan-200/80">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cyan-200/80">Precio</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cyan-200/80">Cantidad</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cyan-200/80">Subtotal</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-cyan-200/80">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-300/10">
                    {cart.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-cyan-300/[0.03]">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-cyan-300/15 bg-slate-900">
                              <img src={item.image.url} alt={item.image.alt} className="h-12 w-12 object-cover" />
                            </div>
                            <span className="text-sm font-semibold text-slate-100">{item.name}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-200"><Price amount={item.price.amount} currency={item.price.currency} /></td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <Input type="number" min={1} max={item.stock} value={item.quantity} onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)} className="w-20" />
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-cyan-200"><Price amount={item.price.amount * item.quantity} currency={item.price.currency} /></td>
                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="text-red-300 hover:bg-red-500/10 hover:text-red-200" aria-label={`Eliminar ${item.name} de la orden`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 2 2 2v2" />
                            </svg>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {error && <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/5 px-3 py-2 text-sm font-medium text-red-300">{error}</p>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="cyber-card p-6">
            <p className="cyber-kicker">CUSTOMER</p>
            <h2 className="mt-1 mb-4 text-lg font-bold text-white">Cliente</h2>
            <Select label="Seleccionar cliente" options={MOCK_CUSTOMERS.map((c) => ({ value: c.id, label: `${c.name} - ${c.email}` }))} value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} placeholder="Seleccionar cliente..." />
            {selectedCustomer && (
              <div className="mt-3 rounded-xl border border-cyan-300/10 bg-slate-950/45 p-3">
                <p className="text-sm font-bold text-slate-100">{selectedCustomer.name}</p>
                <p className="text-xs text-slate-400">{selectedCustomer.email}</p>
              </div>
            )}
          </Card>

          <Card className="cyber-card p-6">
            <p className="cyber-kicker">PAYMENT</p>
            <h2 className="mt-1 mb-4 text-lg font-bold text-white">Método de Pago</h2>
            <Select label="Método de pago" options={PAYMENT_METHODS} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} />
          </Card>

          <Card className="cyber-card p-6">
            <p className="cyber-kicker">TOTAL</p>
            <h2 className="mt-1 mb-4 text-lg font-bold text-white">Resumen</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="font-semibold text-slate-200"><Price amount={subtotal} currency="USD" /></span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Impuestos (21%)</span><span className="font-semibold text-slate-200"><Price amount={tax} currency="USD" /></span></div>
              <div className="border-t border-cyan-300/15 pt-3"><div className="flex items-center justify-between"><span className="text-base font-bold text-slate-100">Total</span><span className="text-xl font-black text-cyan-300"><Price amount={total} currency="USD" /></span></div></div>
            </div>
            <div className="mt-6"><Button variant="solid" size="lg" className="w-full" disabled={cart.length === 0 || !selectedCustomerId || isSubmitting} onClick={handleCreateOrder}>{isSubmitting ? 'Creando...' : 'Crear Orden'}</Button></div>
          </Card>
        </div>
      </div>

      <Modal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} title="Explorar Catálogo" size="xl">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 rounded-2xl border border-cyan-300/10 bg-slate-950/45 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-sm font-semibold text-slate-200">Selecciona los productos que deseas agregar a la orden:</p>
            <div className="w-full shrink-0 sm:w-[min(24rem,42%)]">
              <AdminOrderMiniCart
                variant="inline"
                items={cart}
                totalUnits={totalUnits}
                totalAmount={total}
                currency="USD"
                onIncrement={incrementQuantity}
                onDecrement={decrementQuantity}
                onRemove={removeFromCart}
              />
            </div>
          </div>

          <div className="w-full"><Select label="Categoría" options={CATEGORY_FILTERS} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as CategoryFilter)} placeholder="Filtrar por categoría..." /></div>

          {isLoadingCatalog ? (
            <div className="flex items-center justify-center rounded-2xl border border-cyan-300/10 bg-slate-950/30 py-12"><p className="text-sm font-medium text-slate-400">Cargando productos...</p></div>
          ) : (
            <div className="max-h-[min(30rem,55vh)] overflow-auto rounded-2xl border border-cyan-300/10 bg-slate-950/25">
              <table className="min-w-full">
                <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur"><tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cyan-200/80">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cyan-200/80">Precio</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cyan-200/80">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-cyan-200/80">Acción</th>
                </tr></thead>
                <tbody className="divide-y divide-cyan-300/10">
                  {catalogProducts.map((product) => {
                    const isInCart = cart.some((item) => item.id === product.id);
                    return (
                      <tr key={product.id} className={isInCart ? 'bg-cyan-300/[0.05]' : 'hover:bg-cyan-300/[0.03]'}>
                        <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-cyan-300/15 bg-slate-900"><img src={product.image.url} alt={product.image.alt} className="h-10 w-10 object-cover" /></div><span className="text-sm font-semibold text-slate-100">{product.name}</span></div></td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-200"><Price amount={product.price.amount} currency={product.price.currency} /></td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-300">{product.stock}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right"><Button variant={isInCart ? 'outline' : 'solid'} size="sm" onClick={() => addToCart(product)} disabled={product.stock === 0}>{isInCart ? 'Agregar más' : 'Agregar'}</Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default AdminCreateOrderPage;
