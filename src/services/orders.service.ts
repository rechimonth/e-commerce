/**
 * Servicio de órdenes basado en ejemplo funcional.
 *
 * Implementa:
 * - createOrderFromCart: crea orden desde carrito con transacción y descuento de stock.
 * - getOrderById: obtiene orden por ID.
 * - getOrdersByUser: obtiene órdenes de un usuario.
 * - listOrdersAdmin: lista órdenes para admin.
 * - updateOrderStatusAdmin: actualiza estado de orden.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  type Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type FirestoreDataConverter,
} from 'firebase/firestore';
import { getFirebaseDb, firebaseTryCatch } from '@/infrastructure/firebase/config';
import type { Order, OrderStatus } from '@/types/order';
import type { CurrencyCode } from '@/types/pricing';
import type { Product } from '@/types/domain';

// ======================================================
// TIPOS
// ======================================================

// Cómo se almacenan los datos en Firestore:
// - No se almacena 'id' dentro del documento.
// - createdAt y updatedAt son Timestamp.
type OrderFirestore = Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

// Datos necesarios para crear una orden desde el carrito:
type CreateOrderFromCartData = {
  readonly userId: string;
  readonly items: readonly {
    readonly productId: string;
    readonly name: string;
    readonly priceCents: number;
    readonly quantity: number;
    readonly imageUrl: string;
  }[];
  readonly subtotalCents: number;
  readonly taxCents: number;
  readonly shippingCents: number;
  readonly discountCents: number;
  readonly totalCents: number;
  readonly currency: string;
  readonly shippingAddress: {
    readonly street: string;
    readonly city: string;
    readonly state: string;
    readonly zipCode: string;
    readonly country: string;
  };
  readonly billingAddress: {
    readonly street: string;
    readonly city: string;
    readonly state: string;
    readonly zipCode: string;
    readonly country: string;
  };
  readonly paymentMethod: string;
  readonly notes?: string;
};

// ======================================================
// CONVERTER
// ======================================================

const orderConverter: FirestoreDataConverter<Order> = {
  // Antes de enviar a Firestore:
  toFirestore(order: Order): DocumentData {
    const { id: _id, ...data } = order;
    return {
      ...data,
    };
  },

  // Recibidos desde Firestore:
  fromFirestore(snapshot) {
    const data = snapshot.data() as OrderFirestore;

    return {
      ...data,
      id: snapshot.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
    } satisfies Order;
  },
};

// ======================================================
// COLECCIÓN
// ======================================================

// Devuelve colección transformada por orderConverter:
function ordersCol() {
  return collection(getFirebaseDb(), 'orders').withConverter(orderConverter);
}

// ======================================================
// CREAR ORDEN DESDE CARRITO
// ======================================================

export async function createOrderFromCart(
  orderData: CreateOrderFromCartData,
): Promise<string> {
  // Firebase genera previamente el ID de la orden.
  //
  // La transacción utilizará esta referencia para crear
  // el documento solamente si todas las operaciones
  // finalizan correctamente.
  const db = getFirebaseDb();
  const orderRef = doc(collection(db, 'orders'));

  return firebaseTryCatch(async () => {
    await runTransaction(db, async (transaction) => {
      // Referencias de los productos involucrados.
      const productRefs = orderData.items.map((orderItem) =>
        doc(db, 'products', orderItem.productId),
      );

      // 1. LEER TODOS LOS PRODUCTOS
      const productSnapshots = await Promise.all(
        productRefs.map((ref) => transaction.get(ref)),
      );

      // 2. VALIDAR STOCK
      productSnapshots.forEach((snapshot, index) => {
        if (!snapshot.exists()) {
          throw new Error(
            'Producto no encontrado: ' + orderData.items[index]!.productId,
          );
        }
        const product = snapshot.data() as Product;
        const requestedQuantity = orderData.items[index]!.quantity;
        if (product.stock < requestedQuantity) {
          throw new Error(
            'Ya no contamos con stock suficiente para ' + product.name + '. ' +
              'Solo disponemos de ' + product.stock + ' unidades.',
          );
        }
      });

      // 3. DESCONTAR STOCK
      productSnapshots.forEach((snapshot, index) => {
        const product = snapshot.data() as Product;
        const requestedQuantity = orderData.items[index]!.quantity;
        transaction.update(productRefs[index]!, {
          stock: product.stock - requestedQuantity,
        });
      });

      // 4. CREAR ORDEN
      const now = new Date();
      const orderToSave: Order = {
        id: orderRef.id,
        userId: orderData.userId,
        items: orderData.items.map((item) => ({
          orderId: orderRef.id,
          productId: item.productId,
          name: item.name,
          price: { amount: item.priceCents, currency: orderData.currency as CurrencyCode },
          quantity: item.quantity,
          image: { url: item.imageUrl, alt: item.name, key: orderRef.id },
        })),
        pricing: {
          subtotal: { amount: orderData.subtotalCents, currency: orderData.currency as CurrencyCode },
          tax: { amount: orderData.taxCents, currency: orderData.currency as CurrencyCode },
          shipping: { amount: orderData.shippingCents, currency: orderData.currency as CurrencyCode },
          discount: { amount: orderData.discountCents, currency: orderData.currency as CurrencyCode },
          total: { amount: orderData.totalCents, currency: orderData.currency as CurrencyCode },
        },
        status: 'pending',
        statusHistory: [
          {
            from: 'pending',
            to: 'pending',
            by: orderData.userId,
            timestamp: now,
          },
        ],
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        paymentMethod: orderData.paymentMethod as Order['paymentMethod'],
        notes: orderData.notes,
        createdAt: now,
        updatedAt: now,
      };

      transaction.set(orderRef, orderToSave);
    });

    return orderRef.id;
  });
}

// ======================================================
// OBTENER ORDEN POR ID
// ======================================================

export async function getOrderById(orderId: string): Promise<Order | null> {
  return firebaseTryCatch(async () => {
    const snap = await getDoc(doc(ordersCol(), orderId));
    if (!snap.exists()) {
      return null;
    }
    return snap.data();
  });
}

// ======================================================
// OBTENER ÓRDENES DE UN USUARIO
// ======================================================

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  return firebaseTryCatch(async () => {
    const q = query(
      ordersCol(),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => doc.data());
  });
}

// ======================================================
// LISTAR ÓRDENES — ADMIN
// ======================================================

export async function listOrdersAdmin(params?: {
  status?: OrderStatus;
}): Promise<Order[]> {
  return firebaseTryCatch(async () => {
    const q = params?.status
      ? query(
          ordersCol(),
          where('status', '==', params.status),
          orderBy('createdAt', 'desc'),
        )
      : query(ordersCol(), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => doc.data());
  });
}

// ======================================================
// ACTUALIZAR ESTADO — ADMIN
// ======================================================

export async function updateOrderStatusAdmin(
  orderId: string,
  nextStatus: OrderStatus,
): Promise<void> {
  return firebaseTryCatch(async () => {
    await updateDoc(doc(ordersCol(), orderId), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  });
}
