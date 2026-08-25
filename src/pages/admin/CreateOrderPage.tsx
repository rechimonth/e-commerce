import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Price } from '@/components/ui/Price';
import { productsService } from '@/services/productsService';
import { ROUTES } from '@/constants/routes';
import type { Product } from '@/types/domain';

type PaymentMethod = 'card' | 'paypal' | 'cash';

interface CartItem extends Product {
  readonly quantity: number;
}

interface Customer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'admin',
    name: 'ADMIN',
    email: 'admin@ecommerce.com',
  },
  {
    id: 'customer',
    name: 'CUSTOMER',
    email: 'customer@ecommerce.com',
  },
];

const PAYMENT_METHODS = [
  { value: 'card', label: 'Tarjeta de crédito/débito' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'cash', label: 'Efectivo contra entrega' },
];

const TAX_RATE = 0.21;

export function AdminCreateOrderPage() {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  useEffect(() => {
    if (!isCatalogOpen) return;
    let isMounted = true;
    setIsLoadingCatalog(true);
    productsService
      .fetchProductsAdmin({ limit: 100 })
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
  }, [isCatalogOpen]);

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

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price.amount * item.quantity, 0), [cart]);
  const tax = useMemo(() => subtotal * TAX_RATE, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const handleCreateOrder = async () => {
    if (!selectedCustomerId || cart.length === 0) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.warn('Orden creada:', {
        customerId: selectedCustomerId,
        paymentMethod,
        items: cart,
        subtotal,
        tax,
        total,
      });
      alert('Orden creada exitosamente (simulado)');
      setCart([]);
      setSelectedCustomerId('');
      setPaymentMethod('card');
    } catch (error) {
      console.error('Error al crear orden:', error);
      alert('Error al crear la orden');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCustomer = MOCK_CUSTOMERS.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Crear Orden</h1>
        <Link to={ROUTES.ADMIN_ORDERS}>
          <Button variant="outline" size="md">
            Volver a órdenes
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Productos</h2>
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                </div>
                <p className="text-neutral-600">No hay productos seleccionados</p>
                <p className="mt-1 text-sm text-neutral-500">Haz clic en "Explorar Catálogo" para agregar productos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Precio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Cantidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Subtotal</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {cart.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100">
                              <img src={item.image.url} alt={item.image.alt} className="h-12 w-12 object-cover" />
                            </div>
                            <span className="text-sm font-medium text-neutral-900">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-600">
                          <Price amount={item.price.amount} currency={item.price.currency} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Input
                            type="number"
                            min={1}
                            max={item.stock}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                          <Price amount={item.price.amount * item.quantity} currency={item.price.currency} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-error-600 hover:text-error-700 hover:bg-error-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Cliente</h2>
            <Select
              label="Seleccionar cliente"
              options={MOCK_CUSTOMERS.map((c) => ({ value: c.id, label: `${c.name} - ${c.email}` }))}
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              placeholder="Seleccionar cliente..."
            />
            {selectedCustomer && (
              <div className="mt-3 rounded-md bg-neutral-50 p-3">
                <p className="text-sm font-medium text-neutral-900">{selectedCustomer.name}</p>
                <p className="text-xs text-neutral-500">{selectedCustomer.email}</p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Método de Pago</h2>
            <Select
              label="Método de pago"
              options={PAYMENT_METHODS}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            />
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Resumen</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-medium text-neutral-900">
                  <Price amount={subtotal} currency="USD" />
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Impuestos (21%)</span>
                <span className="font-medium text-neutral-900">
                  <Price amount={tax} currency="USD" />
                </span>
              </div>
              <div className="border-t border-neutral-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-neutral-900">Total</span>
                  <span className="text-xl font-bold text-primary-600">
                    <Price amount={total} currency="USD" />
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button
                variant="solid"
                size="lg"
                className="w-full"
                disabled={cart.length === 0 || !selectedCustomerId || isSubmitting}
                onClick={handleCreateOrder}
              >
                {isSubmitting ? 'Creando...' : 'Crear Orden'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} title="Explorar Catálogo" size="xl">
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">Selecciona los productos que deseas agregar a la orden:</p>
          {isLoadingCatalog ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-neutral-500">Cargando catálogo...</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Precio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {catalogProducts.map((product) => {
                    const isInCart = cart.some((item) => item.id === product.id);
                    return (
                      <tr key={product.id} className={isInCart ? 'bg-primary-50/50' : ''}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100">
                              <img src={product.image.url} alt={product.image.alt} className="h-10 w-10 object-cover" />
                            </div>
                            <span className="text-sm font-medium text-neutral-900">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-600">
                          <Price amount={product.price.amount} currency={product.price.currency} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-600">{product.stock}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <Button
                            variant={isInCart ? 'outline' : 'solid'}
                            size="sm"
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                          >
                            {isInCart ? 'Agregar más' : 'Agregar'}
                          </Button>
                        </td>
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
