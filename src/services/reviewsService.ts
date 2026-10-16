import { getProductReviews, type ProductReviewDTO } from '@/infrastructure/firebase/firestore';
import { getCurrentUserIdToken } from '@/infrastructure/firebase/auth';

export interface ProductReview {
  readonly id: string;
  readonly productId: string;
  readonly rating: number;
  readonly comment: string;
  readonly displayName: string;
  readonly createdAt: Date;
}

function toReview(dto: ProductReviewDTO): ProductReview {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
  };
}

export const reviewsService = {
  async fetchProductReviews(productId: string): Promise<ProductReview[]> {
    const reviews = await getProductReviews(productId, 20);
    return reviews.map(toReview);
  },

  async fetchMyReviewId(productId: string): Promise<string | null> {
    const token = await getCurrentUserIdToken();
    const response = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => null) as { success?: boolean; reviewId?: string | null; error?: string } | null;
    if (!response.ok || !payload?.success) throw new Error(payload?.error ?? 'No se pudo consultar tu reseña');
    return typeof payload.reviewId === 'string' ? payload.reviewId : null;
  },

  async deleteProductReview(productId: string): Promise<void> {
    const token = await getCurrentUserIdToken();
    const response = await fetch('/api/reviews', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId }),
    });
    const payload = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
    if (!response.ok || !payload?.success) throw new Error(payload?.error ?? 'No se pudo eliminar la reseña');
  },

  async submitProductReview(productId: string, rating: number, comment: string): Promise<void> {
    const token = await getCurrentUserIdToken();
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, rating, comment }),
    });
    const payload = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'No se pudo guardar la reseña');
    }
  },
};
