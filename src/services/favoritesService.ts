import { getCurrentUserIdToken } from '@/infrastructure/firebase/auth';

interface FavoritesApiEnvelope<T> {
  readonly success?: boolean;
  readonly data?: T;
  readonly error?: string;
}

interface FavoriteListData {
  readonly favoriteIds: string[];
}

interface FavoriteMutationData {
  readonly productId: string;
}

async function requestFavorites<T>(
  method: 'GET' | 'POST' | 'DELETE',
  productId?: string,
): Promise<T> {
  const token = await getCurrentUserIdToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };

  if (productId !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch('/api/favorites', {
      method,
      headers,
      ...(productId === undefined ? {} : { body: JSON.stringify({ productId }) }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servicio de Favoritos.');
  }

  const payload = await response.json().catch(() => null) as FavoritesApiEnvelope<T> | null;
  if (!response.ok || !payload?.success || payload.data === undefined) {
    throw new Error(payload?.error ?? `La solicitud de Favoritos falló (HTTP ${response.status}).`);
  }

  return payload.data;
}

export const favoritesService = {
  async list(): Promise<string[]> {
    const data = await requestFavorites<FavoriteListData>('GET');
    return data.favoriteIds;
  },

  async add(productId: string): Promise<void> {
    await requestFavorites<FavoriteMutationData>('POST', productId);
  },

  async remove(productId: string): Promise<void> {
    await requestFavorites<FavoriteMutationData>('DELETE', productId);
  },
};
