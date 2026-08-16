/**
 * Barrel de la capa de infraestructura de Firebase.
 *
 * IMPORTANTE: Esta capa NO debe consumirse directamente desde componentes.
 * Los componentes usan hooks → services → infrastructure.
 */
export * from './config';
export * from './auth';
export * from './firestore';
