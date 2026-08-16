/**
 * Funciones de Firestore para productos y órdenes.
 *
 * Esta capa abstrae el Firestore SDK. Convierte documentos de Firestore
 * a DTOs tipados. La capa services (futura) hará DTO → Entity.
 *
 * NUNCA debe usarse directamente desde componentes.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  type Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { ProductDTO, ProductCategory } from '@/types/domain';
import type { OrderDTO, OrderStatus } from '@/types/order';
import type { Address, PaymentMethod } from '@/types/order';
import { getFirebaseDb, firebaseTryCatch } from './config';

interface FirestoreTimestampLike {
  seconds: number;
  nanoseconds: number;
}

function toTimestampObj(ts: unknown): FirestoreTimestampLike {
  if (!ts) return { seconds: 0, nanoseconds: 0 };
  const t = ts as { seconds?: number; nanoseconds?: number };
  return { seconds: t.seconds ?? 0, nanoseconds: t.nanoseconds ?? 0 };
}

function toMillis(ts: unknown): number {
  if (!ts) return Date.now();
  const t = ts as { toMillis?: () => number };
  if (typeof t.toMillis === 'function') {
    return t.toMillis();
  }
  return typeof ts === 'number' ? ts : Date.now();
}

/* ------------------------------------------------------------------ */
/*                          PRODUCT FUNCTIONS                          */
/* ------------------------------------------------------------------ */

export interface ProductFilters {
  readonly category?: ProductCategory;
  readonly isActive?: boolean;
  readonly limit?: number;
}

export type CreateProductInput = Omit<ProductDTO, 'id' | 'createdAt' | 'updatedAt'>;

export async function getProducts(filters?: ProductFilters): Promise<ProductDTO[]> {
  return firebaseTryCatch(async () => {
    const db = getFirebaseDb();
    let q = query(collection(db, 'products'));

    const constraints = [];
    if (filters?.category) constraints.push(where('category', '==', filters.category));
    if (filters?.isActive !== undefined)
      constraints.push(where('isActive', '==', filters.isActive));
    q = query(q, ...constraints, orderBy('createdAt', 'desc') as ReturnType<typeof orderBy>);
    if (filters?.limit) q = query(q, firestoreLimit(filters.limit));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => docToProduct(doc));
  });
}

export async function getProduct(id: string): Promise<ProductDTO | null> {
  return firebaseTryCatch(async () => {
    const db = getFirebaseDb();
    const docSnap = await getDoc(doc(db, 'products', id));
    if (!docSnap.exists()) return null;
    return docToProduct(docSnap);
  });
}

export async function createProduct(
  product: Omit<ProductDTO, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<ProductDTO> {
  return firebaseTryCatch(async () => {
    const db = getFirebaseDb();
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Product not found after creation');
    return docToProduct(docSnap);
  });
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<ProductDTO, 'id'>>,
): Promise<ProductDTO | null> {
  return firebaseTryCatch(async () => {
    const db = getFirebaseDb();
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
    const updatedSnap = await getDoc(docRef);
    if (!updatedSnap.exists()) return null;
    return docToProduct(updatedSnap);
  });
}

export async function deleteProduct(id: string): Promise<boolean> {
  return firebaseTryCatch(async () => {
    const db = getFirebaseDb();
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;

    await deleteDoc(docRef);
    return true;
  });
}

function docToProduct(docSnap: QueryDocumentSnapshot<DocumentData>): ProductDTO {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name ?? '',
    description: data.description ?? '',
    priceCents: data.priceCents ?? data.price_cents ?? 0,
    currency: (data.currency ?? 'USD') as ProductDTO['currency'],
    category: data.category ?? 'electronics',
    imageKey: data.imageKey ?? data.image_key ?? '',
    imageUrl: data.imageUrl ?? data.image_url ?? '',
    stock: data.stock ?? 0,
    rating: data.rating ?? 0,
    reviewCount: data.reviewCount ?? data.review_count ?? 0,
    isActive: data.isActive ?? data.is_active ?? false,
    createdAt: toTimestampObj(data.createdAt),
    updatedAt: toTimestampObj(data.updatedAt),
    createdBy: data.createdBy ?? data.created_by ?? '',
  };
}

/* ------------------------------------------------------------------ */
/*                          ORDER FUNCTIONS                           */
/* ------------------------------------------------------------------ */

export interface OrderFilters {
  readonly status?: OrderStatus;
  readonly limit?: number;
}

export async function createOrder(
  order: Omit<OrderDTO, 'id' | 'status' | 'statusHistory'>,
): Promise<OrderDTO> {
  return firebaseTryCatch(async () => {
    const db = getFirebaseDb();
    const now = serverTimestamp();
    const initialTransition = {
      from: 'pending' as OrderStatus,
      to: 'pending' as OrderStatus,
      by: order.userId,
      timestamp: now,
    };

    const docRef = await addDoc(collection(db, 'orders'), {
      ...order,
      status: 'pending',
      statusHistory: [initialTransition],
      createdAt: now,
      updatedAt: now,
    });

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Order not found after creation');
    return snapToOrder(docSnap);
  });
}

export async function getUserOrders(userId: string): Promise<OrderDTO[]> {
  return firebaseTryCatch(async () => {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => snapToOrder(doc));
  });
}

export async function getUserOrdersByStatus(
  userId: string,
  status: OrderStatus,
): Promise<OrderDTO[]> {
  return firebaseTryCatch(async () => {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => snapToOrder(doc));
  });
}

export async function getOrder(id: string): Promise<OrderDTO | null> {
  return firebaseTryCatch(async () => {
    const db = getFirebaseDb();
    const docSnap = await getDoc(doc(db, 'orders', id));
    if (!docSnap.exists()) return null;
    return snapToOrder(docSnap);
  });
}

export async function getAllOrders(filters?: OrderFilters): Promise<OrderDTO[]> {
  return firebaseTryCatch(async () => {
    const db = getFirebaseDb();
    const constraints: Parameters<typeof query>[1][] = [];

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    if (filters?.limit) constraints.push(firestoreLimit(filters.limit));

    const q = query(collection(db, 'orders'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => snapToOrder(doc));
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus, adminUserId: string): Promise<OrderDTO | null> {
  return firebaseTryCatch(async () => {
    const db = getFirebaseDb();
    const docRef = doc(db, 'orders', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const currentData = docSnap.data();
    const currentStatus = (currentData.status ?? 'pending') as OrderStatus;
    const rawHistory = (currentData.statusHistory ?? currentData.status_history ?? []) as Array<{
      from: OrderStatus;
      to: OrderStatus;
      by: string;
      reason?: string;
      timestamp: Timestamp | number;
    }>;

    const newHistory = [
      ...rawHistory,
      {
        from: currentStatus,
        to: status,
        by: adminUserId,
        timestamp: serverTimestamp(),
      },
    ];

    await updateDoc(docRef, {
      status,
      statusHistory: newHistory,
      updatedAt: serverTimestamp(),
    });

    const updatedSnap = await getDoc(docRef);
    if (!updatedSnap.exists()) return null;
    return snapToOrder(updatedSnap);
  });
}

function snapToOrder(docSnap: QueryDocumentSnapshot<DocumentData>): OrderDTO {
  const data = docSnap.data();

  return {
    id: docSnap.id,
    userId: data.userId ?? '',
    items: (data.items ?? []).map(
      (item: {
        productId: string;
        name: string;
        priceCents?: number;
        price?: number;
        quantity: number;
        imageUrl: string;
        orderId?: string;
      }) => ({
        productId: item.productId,
        name: item.name,
        priceCents: item.priceCents ?? item.price ?? 0,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        orderId: item.orderId ?? docSnap.id,
      }),
    ),
    subtotalCents: data.subtotalCents ?? data.subtotal_cents ?? 0,
    taxCents: data.taxCents ?? data.tax_cents ?? 0,
    shippingCents: data.shippingCents ?? data.shipping_cents ?? 0,
    discountCents: data.discountCents ?? data.discount_cents ?? 0,
    totalCents: data.totalCents ?? data.total_cents ?? 0,
    currency: (data.currency ?? 'USD') as OrderDTO['currency'],
    status: (data.status ?? 'pending') as OrderStatus,
    statusHistory: (data.statusHistory ?? data.status_history ?? []).map(
      (entry: {
        from: OrderStatus;
        to: OrderStatus;
        by: string;
        reason?: string;
        timestamp: Timestamp | number;
      }) => ({
        from: entry.from,
        to: entry.to,
        by: entry.by,
        reason: entry.reason,
        timestamp: toMillis(entry.timestamp),
      }),
    ),
    shippingAddress: data.shippingAddress ?? data.shipping_address ?? {},
    billingAddress:
      data.billingAddress ??
      data.billing_address ??
      data.shippingAddress ??
      data.shipping_address ??
      {},
    paymentMethod: (data.paymentMethod ?? data.payment_method ?? 'card') as PaymentMethod,
    notes: data.notes,
  };
}

export type { Address, PaymentMethod as PaymentMethodType };
