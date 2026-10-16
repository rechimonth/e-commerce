import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/infrastructure/firebase/config';
import { productsService } from '@/services/productsService';
import type { Product } from '@/types/domain';

const MAX_RECENT_PRODUCTS = 5;

export const recentlyViewedService = {
  async record(uid: string, productId: string): Promise<void> {
    if (!uid || !productId || productId.length > 128 || productId.includes('/')) return;
    const reference = doc(getFirebaseDb(), 'users', uid, 'recentlyViewed', productId);
    await setDoc(reference, { productId, viewedAt: serverTimestamp() }, { merge: true });
  },

  async fetch(uid: string): Promise<Product[]> {
    if (!uid) return [];
    const reference = collection(getFirebaseDb(), 'users', uid, 'recentlyViewed');
    const snapshot = await getDocs(query(reference, orderBy('viewedAt', 'desc'), limit(MAX_RECENT_PRODUCTS)));
    const products = await Promise.all(snapshot.docs.map(async (entry) => {
      const productId = entry.data().productId;
      if (typeof productId !== 'string') return null;
      try {
        const product = await productsService.fetchProduct(productId);
        return product?.isActive ? product : null;
      } catch {
        return null;
      }
    }));
    return products.filter((product): product is Product => product !== null).slice(0, MAX_RECENT_PRODUCTS);
  },
};
