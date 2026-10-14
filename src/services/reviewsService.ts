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
