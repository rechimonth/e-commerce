/**
 * ProductsService — capa de servicios para productos.
 *
 * Responsabilidades:
 * - Orquestar llamadas a la capa de infraestructura (Firestore).
 * - Convertir ProductDTO → Product entity (Firestore → dominio).
 * - Proveer un interfaz pagination-ready para futuras extensiones.
 *
 * NUNCA debe importar Firebase directamente.
 * Importa funciones de @/infrastructure/firebase/firestore.
 */
import {
  getProducts,
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
}

export type ProductsResult = PaginatedResult<Product>;

const DEFAULT_LIMIT = 20;

function toProduct(dto: ProductDTO): Product {
  const dtoDate = dto.createdAt;
  const createdAtMs =
    typeof dtoDate === 'object' && dtoDate !== null
      ? dtoDate.seconds * 1000 + dtoDate.nanoseconds / 1e6
      : Date.now();

  const updatedAtMs =
    typeof dto.updatedAt === 'object' && dto.updatedAt !== null
      ? dto.updatedAt.seconds * 1000 + dto.updatedAt.nanoseconds / 1e6
      : Date.now();

  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    price: {
      amount: dto.priceCents,
      currency: dto.currency,
    },
    category: dto.category,
    image: {
      url: dto.imageUrl,
      alt: dto.name,
      key: dto.imageKey,
    },
    stock: dto.stock,
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    isActive: dto.isActive,
    createdAt: new Date(createdAtMs),
    updatedAt: new Date(updatedAtMs),
    createdBy: dto.createdBy,
  };
}

export const productsService = {
  async fetchProducts(params: FetchProductsParams = {}): Promise<ProductsResult> {
    return firebaseTryCatch(async () => {
      const { search, category, limit = DEFAULT_LIMIT, cursor: _cursor } = params;

      const activeProducts = await getProducts({
        category,
        isActive: true,
        limit,
      });

      const allItems = activeProducts.map(toProduct);

      const filtered = search
        ? allItems.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()),
          )
        : allItems;

      return {
        items: filtered,
        pagination: {
          page: 1,
          limit,
          total: filtered.length,
          hasNext: filtered.length >= limit,
          hasPrev: false,
        },
      };
    });
  },

  async fetchProduct(id: string): Promise<Product | null> {
    return firebaseTryCatch(async () => {
      const dto = await getProduct(id);
      if (!dto) return null;
      return toProduct(dto);
    });
  },

  async fetchProductsAdmin(params: FetchProductsParams = {}): Promise<ProductsResult> {
    return firebaseTryCatch(async () => {
      const { search, category, limit = DEFAULT_LIMIT, cursor } = params;

      const allProducts = await getProducts({ category, limit: limit ? limit + 1 : undefined });
      const items = allProducts.map(toProduct);

      const filtered = search
        ? items.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
        : items;

      const pageItems = cursor ? filtered : filtered.slice(0, limit);
      const hasNext = filtered.length > limit;
      const hasPrev = Boolean(cursor);

      return {
        items: pageItems,
        pagination: {
          page: cursor ? 2 : 1,
          limit,
          total: filtered.length,
          hasNext,
          hasPrev,
        },
      };
    });
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreCreateProduct(input);
      return toProduct(dto);
    });
  },

  async updateProduct(id: string, updates: Partial<CreateProductInput>): Promise<Product | null> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreUpdateProduct(id, updates);
      if (!dto) return null;
      return toProduct(dto);
    });
  },

  async deleteProduct(id: string): Promise<boolean> {
    return firebaseTryCatch(async () => {
      return await firestoreDeleteProduct(id);
    });
  },

  toProduct,

  async activateProduct(id: string): Promise<Product | null> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreUpdateProduct(id, { isActive: true });
      if (!dto) return null;
      return toProduct(dto);
    });
  },

  async deactivateProduct(id: string): Promise<Product | null> {
    return firebaseTryCatch(async () => {
      const dto = await firestoreUpdateProduct(id, { isActive: false });
      if (!dto) return null;
      return toProduct(dto);
    });
  },
};

export type { ProductDTO } from '@/types/domain';

