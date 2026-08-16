import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productsService } from '@/services/productsService';
import type { ProductDTO } from '@/types/domain';

vi.mock('@/infrastructure/firebase/firestore', () => ({
  getProducts: vi.fn(),
  getProduct: vi.fn(),
}));

vi.mock('@/infrastructure/firebase/config', () => ({
  getFirebaseDb: vi.fn(() => ({ _type: 'Firestore' })),
  firebaseTryCatch: async (fn: () => Promise<unknown>) => fn(),
}));

const mockProducts: ProductDTO[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone',
    priceCents: 99999,
    currency: 'USD',
    category: 'electronics',
    imageKey: 'iphone-key',
    imageUrl: 'https://example.com/iphone.jpg',
    stock: 10,
    rating: 4.8,
    reviewCount: 128,
    isActive: true,
    createdAt: { seconds: 1700000000, nanoseconds: 0 },
    updatedAt: { seconds: 1700000000, nanoseconds: 0 },
    createdBy: 'admin',
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24',
    description: 'Android flagship',
    priceCents: 89999,
    currency: 'USD',
    category: 'electronics',
    imageKey: 'samsung-key',
    imageUrl: 'https://example.com/samsung.jpg',
    stock: 5,
    rating: 4.5,
    reviewCount: 96,
    isActive: true,
    createdAt: { seconds: 1700000000, nanoseconds: 0 },
    updatedAt: { seconds: 1700000000, nanoseconds: 0 },
    createdBy: 'admin',
  },
];

describe('productsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchProducts returns mapped Product entities', async () => {
    const { getProducts } = await import('@/infrastructure/firebase/firestore');
    (getProducts as ReturnType<typeof vi.fn>).mockResolvedValue(mockProducts);

    const result = await productsService.fetchProducts();

    expect(getProducts).toHaveBeenCalledWith({
      isActive: true,
      limit: 20,
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0]!.id).toBe('1');
    expect(result.items[0]!.name).toBe('iPhone 15 Pro');
    expect(result.items[0]!.price.amount).toBe(99999);
    expect(result.items[0]!.price.currency).toBe('USD');
    expect(result.items[0]!.image.url).toBe('https://example.com/iphone.jpg');
    expect(result.items[0]!.image.alt).toBe('iPhone 15 Pro');
    expect(result.items[0]!.createdAt).toBeInstanceOf(Date);
  });

  it('fetchProducts filters by category', async () => {
    const { getProducts } = await import('@/infrastructure/firebase/firestore');
    (getProducts as ReturnType<typeof vi.fn>).mockResolvedValue(mockProducts);

    await productsService.fetchProducts({ category: 'electronics' });

    expect(getProducts).toHaveBeenCalledWith({
      category: 'electronics',
      isActive: true,
      limit: 20,
    });
  });

  it('fetchProducts filters by search term (client-side)', async () => {
    const { getProducts } = await import('@/infrastructure/firebase/firestore');
    (getProducts as ReturnType<typeof vi.fn>).mockResolvedValue(mockProducts);

    const result = await productsService.fetchProducts({ search: 'iPhone' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.name).toBe('iPhone 15 Pro');
  });

  it('fetchProducts returns empty for non-matching search', async () => {
    const { getProducts } = await import('@/infrastructure/firebase/firestore');
    (getProducts as ReturnType<typeof vi.fn>).mockResolvedValue(mockProducts);

    const result = await productsService.fetchProducts({ search: 'xyz' });

    expect(result.items).toHaveLength(0);
  });

  it('fetchProduct returns a single product', async () => {
    const { getProduct } = await import('@/infrastructure/firebase/firestore');
    (getProduct as ReturnType<typeof vi.fn>).mockResolvedValue(mockProducts[0]);

    const result = await productsService.fetchProduct('1');

    expect(getProduct).toHaveBeenCalledWith('1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('1');
    expect(result!.price.amount).toBe(99999);
  });

  it('fetchProduct returns null for non-existent product', async () => {
    const { getProduct } = await import('@/infrastructure/firebase/firestore');
    (getProduct as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await productsService.fetchProduct('999');

    expect(result).toBeNull();
  });

  it('toProduct converts DTO to entity correctly', () => {
    const dto: ProductDTO = mockProducts[0]!;
    const product = productsService.toProduct(dto);

    expect(product.id).toBe(dto.id);
    expect(product.name).toBe(dto.name);
    expect(product.price.amount).toBe(dto.priceCents);
    expect(product.price.currency).toBe(dto.currency);
    expect(product.image.url).toBe(dto.imageUrl);
    expect(product.image.alt).toBe(dto.name);
    expect(product.image.key).toBe(dto.imageKey);
    expect(product.category).toBe(dto.category);
    expect(product.stock).toBe(dto.stock);
    expect(product.rating).toBe(dto.rating);
    expect(product.reviewCount).toBe(dto.reviewCount);
    expect(product.isActive).toBe(dto.isActive);
    expect(product.createdAt).toBeInstanceOf(Date);
    expect(product.createdBy).toBe(dto.createdBy);
  });
});
