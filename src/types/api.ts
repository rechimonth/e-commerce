/**
 * Tipos de API y servicios.
 *
 * ApiResult usa discriminated union para forzar el manejo de errores.
 * ServiceError captura el contexto del error sin exponer detalles internos.
 */

export const SERVICE_ERROR_CODES = [
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'CONFLICT',
  'INTERNAL_ERROR',
  'NETWORK_ERROR',
  'QUOTA_EXCEEDED',
] as const;

export type ServiceErrorCode = (typeof SERVICE_ERROR_CODES)[number];

export interface ServiceError {
  readonly code: ServiceErrorCode;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export interface ApiResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ServiceError;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly pagination: PaginationState;
}

export interface PaginationState {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
}

export function createPagination(page: number, limit: number, total: number): PaginationState {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const current = Math.max(1, Math.min(page, totalPages));
  return {
    page: current,
    limit,
    total,
    hasNext: current < totalPages,
    hasPrev: current > 1,
  };
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
