/**
 * Tipos de estado de UI.
 *
 * AsyncState usa discriminated union para hacer imposibles estados inválidos:
 * - idle: data es null, error es null
 * - loading: data puede ser null o T (valor previo mientras carga)
 * - success: data es T, error es null
 * - error: data es null, error es ServiceError
 */
import type { ServiceError } from './api';

export const ASYNC_STATUSES = ['idle', 'loading', 'success', 'error'] as const;

export type AsyncStatus = (typeof ASYNC_STATUSES)[number];

export interface AsyncIdle {
  readonly status: 'idle';
  readonly data: null;
  readonly error: null;
}

export interface AsyncLoading<T> {
  readonly status: 'loading';
  readonly data: T | null;
  readonly error: null;
}

export interface AsyncSuccess<T> {
  readonly status: 'success';
  readonly data: T;
  readonly error: null;
}

export interface AsyncError {
  readonly status: 'error';
  readonly data: null;
  readonly error: ServiceError;
}

export type AsyncState<T> = AsyncIdle | AsyncLoading<T> | AsyncSuccess<T> | AsyncError;

export function isAsyncSuccess<T>(state: AsyncState<T>): state is AsyncSuccess<T> {
  return state.status === 'success';
}

export function isAsyncError<T>(state: AsyncState<T>): state is AsyncError {
  return state.status === 'error';
}

export function isAsyncLoading<T>(state: AsyncState<T>): state is AsyncLoading<T> {
  return state.status === 'loading';
}

export function isAsyncIdle<T>(state: AsyncState<T>): state is AsyncIdle {
  return state.status === 'idle';
}

export const BUTTON_VARIANTS = ['solid', 'outline', 'danger', 'link', 'ghost'] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;

export type ButtonSize = (typeof BUTTON_SIZES)[number];

export const PRODUCT_CARD_VARIANTS = ['default', 'compact', 'featured'] as const;

export type ProductCardVariant = (typeof PRODUCT_CARD_VARIANTS)[number];

export const ALERT_VARIANTS = ['info', 'success', 'warning', 'error'] as const;

export type AlertVariant = (typeof ALERT_VARIANTS)[number];

export const BADGE_VARIANTS = ['default', 'success', 'warning', 'error', 'info'] as const;

export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

export const SKELETON_VARIANTS = ['default', 'rounded', 'circular'] as const;

export type SkeletonVariant = (typeof SKELETON_VARIANTS)[number];

export interface EmptyStateConfig {
  readonly title: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly actionHref?: string;
}

export const EMPTY_STATES = {
  cart: {
    title: 'Tu carrito está vacío',
    description: 'Explora nuestro catálogo y agrega productos.',
    actionLabel: 'Ver productos',
    actionHref: '/',
  },
  orders: {
    title: 'No tienes órdenes',
    description: 'Realiza tu primera compra para ver el historial.',
    actionLabel: 'Explorar catálogo',
    actionHref: '/',
  },
  products: {
    title: 'No se encontraron productos',
    description: 'Intenta con otro filtro o búsqueda.',
  },
} as const;
