/**
 * Entidades de dominio del e-commerce.
 *
 * Convención:
 * - Entidades (Product, Order, etc.) usan Date, Money (centavos), y tipos enriquecidos.
 * - DTOs (*DTO) representan el shape raw de Firestore (FirestoreTimestamp, centavos como número).
 * - La conversión DTO → Entity ocurre en firestoreService.
 */
import type { Money, CurrencyCode } from './pricing';
import type { FirestoreTimestamp } from './dates';

export const PRODUCT_CATEGORIES = ['action-figures', 'video-games', 'shoes'] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface ProductImage {
  readonly url: string;
  readonly alt: string;
  readonly key: string;
}

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: Money;
  readonly category: ProductCategory;
  readonly image: ProductImage;
  readonly stock: number;
  readonly rating: number;
  readonly reviewCount: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}

export interface ProductDTO {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceCents: number;
  readonly currency: CurrencyCode;
  readonly category: ProductCategory;
  readonly imageKey: string;
  readonly imageUrl: string;
  readonly stock: number;
  readonly rating: number;
  readonly reviewCount: number;
  readonly isActive: boolean;
  readonly createdAt: FirestoreTimestamp;
  readonly updatedAt: FirestoreTimestamp;
  readonly createdBy: string;
}

export interface ProductSummary {
  readonly id: string;
  readonly name: string;
  readonly price: Money;
  readonly category: ProductCategory;
  readonly image: ProductImage;
  readonly stock: number;
  readonly isActive: boolean;
}
