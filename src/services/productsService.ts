/**
 * ProductsService — capa de servicios para productos.
 * Orquesta Firestore y convierte DTOs a entidades de dominio.
 */
import {
  getProducts,
  getProductsPage,
  getProduct,
  createProduct as firestoreCreateProduct,
  updateProduct as firestoreUpdateProduct,
  deleteProduct as firestoreDeleteProduct,
} from '@/infrastructure/firebase/firestore';
import { firebaseTryCatch } from '@/infrastructure/firebase/config';
import type { Product, ProductDTO, ProductCategory } from '@/types/domain';
import type { CreateProductInput } from '@/infrastructure/firebase/firestore';
import type { PaginatedResult } from '@/types/api';

export interface FetchProductsParams {
  readonly search?: string;
  readonly category?: ProductCategory;
  readonly limit?: number;
  readonly cursor?: string | null;
  readonly page?: number;
  readonly sortBy?: 'price-asc' | 'price-desc';

export interface ProductsResult extends PaginatedResult<Product> {
  readonly nextCursor: string | null;
}

const DEFAULT_LIMIT = 20;

function toProduct(dto: ProductDTO): Product {
  const createdAtMs = typeof dto.createdAt === 'object' && dto.createdAt !== null
    ? dto.createdAt.seconds * 1000 + dto.createdAt.nanoseconds / 1e6
    : Date.now();
  const updatedAtMs = typeof dto.updatedAt === 'object' && dto.updatedAt !== null
    ? dto.updatedAt.seconds * 1000 + dto.updatedAt.nanoseconds / 1e6
    : Date.now();
  const image = { url: dto.imageUrl, alt: dto.name, key: dto.imageKey };
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    price: { amount: dto.priceCents, currency: dto.currency },
    category: dto.category,
    image,
    images: dto.images ?? (dto.imageUrl ? [image] : []),
    stock: dto.stock,
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    isActive: dto.isActive,
    createdAt: new Date(createdAtMs),
    updatedAt: new Date(updatedAtMs),
    createdBy: dto.createdBy,
  };
}

function normalizePage(
  items: Product[],
  limit: number,
  page: number,
  nextCursor: string | null,
): ProductsResult {
  return {
    items,
    nextCursor,
    pagination: {
      page: Math.max(1, page),
      limit,
      total: items.length,
      hasNext: nextCursor !== null,
      hasPrev: page > 1,
    },
  };
}

export const productsService = {
  async fetchProducts(params: FetchProductsParams = {}): Promise<ProductsResult> {
    return firebaseTryCatch(async () => {
      const { search, category, limit = DEFAULT_LIMIT, cursor, page = cursor ? 2 : 1, sortBy } = params;
      const normalizedSearch = search?.trim().toLocaleLowerCase();

      // Firestore has no case-insensitive substring query. Search the complete
      // active/category-scoped set before paginating, so matches beyond page one
      // remain discoverable.
      if (normalizedSearch) {
        const allProducts = await getProducts({ category, isActive: true });
        const matches = allProducts
          .map(toProduct)
          .filter((product) => product.name.toLocaleLowerCase().includes(normalizedSearch))
          .sort((a, b) => sortBy === 'price-asc' ? a.price.amount - b.price.amount : sortBy === 'price-desc' ? b.price.amount - a.price.amount : b.createdAt.getTime() - a.createdAt.getTime());
        let startIndex = 0;
        if (cursor) {
          const cursorIndex = matches.findIndex((product) => product.id === cursor);
          startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
        } else if (page > 1) {
          startIndex = (page - 1) * limit;
        }
        const items = matches.slice(startIndex, startIndex + limit);
        const hasNext = startIndex + limit < matches.length;
        return normalizePage(items, limit, page, hasNext ? items[items.length - 1]?.id ?? null : null);
      }

      const result = await getProductsPage({ category, isActive: true, limit, cursor, sortBy });
      return normalizePage(result.items.map(toProduct), limit, page, result.nextCursor);
    });
  },

  async fetchProduct(id: string): Promise<Product | null> {
    return firebaseTryCatch(async () => {
      const dto = await getProduct(id);
      return dto ? toProduct(dto) : null;
    });
  },

  async fetchProductsAdmin(params: FetchProductsParams = {}): Promise<ProductsResult> {
    return firebaseTryCatch(async () => {
      const { search, category, limit = DEFAULT_LIMIT, cursor, page = cursor ? 2 : 1 } = params;
      const result = await getProductsPage({ category, limit, cursor });
      const normalizedSearch = search?.trim().toLocaleLowerCase();
      const items = result.items
        .map(toProduct)
        .filter((product) => !normalizedSearch || product.name.toLocaleLowerCase().includes(normalizedSearch));
      return normalizePage(items, limit, page, result.nextCursor);
    });
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    return firebaseTryCatch(async () => toProduct(await firestoreCreateProduct(input)));
  },

  async updateProduct(id: string, updates: Partial<CreateProductInput>): Promise<Product | null> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreUpdateProduct(id, updates);
      return dto ? toProduct(dto) : null;
    });
  },

  async deleteProduct(id: string): Promise<boolean> {
    return firebaseTryCatch(async () => firestoreDeleteProduct(id));
  },

  toProduct,

  async activateProduct(id: string): Promise<Product | null> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreUpdateProduct(id, { isActive: true });
      return dto ? toProduct(dto) : null;
    });
  },

  async deactivateProduct(id: string): Promise<Product | null> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreUpdateProduct(id, { isActive: false });
      return dto ? toProduct(dto) : null;
    });
  },
};

export type { ProductDTO } from '@/types/domain';
