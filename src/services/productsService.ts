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
}

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

function sortProducts(items: Product[], sortBy?: 'price-asc' | 'price-desc'): Product[] {
  return [...items].sort((a, b) => {
    if (sortBy === 'price-asc') {
      return a.price.amount - b.price.amount
        || b.createdAt.getTime() - a.createdAt.getTime()
        || a.id.localeCompare(b.id);
    }
    if (sortBy === 'price-desc') {
      return b.price.amount - a.price.amount
        || b.createdAt.getTime() - a.createdAt.getTime()
        || a.id.localeCompare(b.id);
    }
    return b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id);
  });
}

function paginateProducts(
  items: Product[],
  limit: number,
  page: number,
  cursor?: string | null,
): ProductsResult {
  const cursorIndex = cursor ? items.findIndex((product) => product.id === cursor) : -1;
  const startIndex = cursorIndex >= 0
    ? cursorIndex + 1
    : Math.max(0, page - 1) * limit;
  const pageItems = items.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < items.length
    ? pageItems[pageItems.length - 1]?.id ?? null
    : null;
  return normalizePage(pageItems, limit, page, nextCursor);
}

function isMissingPriceIndexError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as {
    message?: unknown;
    code?: unknown;
    details?: unknown;
  };
  const message = typeof candidate.message === 'string' ? candidate.message : '';
  const details = candidate.details && typeof candidate.details === 'object'
    ? candidate.details as Record<string, unknown>
    : {};
  const originalCode = String(details.originalCode ?? candidate.code ?? '');
  return (
    (/failed-precondition/i.test(originalCode) && /index/i.test(message))
    || /the query requires an index|query requires an index/i.test(message)
  );
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
        // Search is performed client-side, so fetch an unordered set and sort locally.
        // This also keeps search usable if production has not yet received composite indexes.
        const allProducts = await getProducts({ category, isActive: true, sortBy: 'none' });
        const matches = sortProducts(
          allProducts
            .map(toProduct)
            .filter((product) => product.name.toLocaleLowerCase().includes(normalizedSearch)),
          sortBy,
        );
        return paginateProducts(matches, limit, page, cursor);
      }

      try {
        const result = await getProductsPage({ category, isActive: true, limit, cursor, sortBy });
        return normalizePage(result.items.map(toProduct), limit, page, result.nextCursor);
      } catch (error) {
        // Firestore composite indexes declared in firestore.indexes.json must also be
        // deployed to the live project. Keep price sorting functional when an index is missing;
        // use an unordered query and paginate locally as a compatibility fallback.
        if (!sortBy || !isMissingPriceIndexError(error)) throw error;
        const allProducts = await getProducts({ category, isActive: true, sortBy: 'none' });
        return paginateProducts(sortProducts(allProducts.map(toProduct), sortBy), limit, page, cursor);
      }
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
