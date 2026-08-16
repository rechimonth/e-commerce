/**
 * Estrategia de fechas entre Firestore y UI.
 *
 * Firestore almacena timestamps como objetos con `seconds` y `nanoseconds`.
 * La capa de servicios (firestoreService) convierte estos Timestamps a
 * instancias de Date antes de devolverlas al UI layer.
 *
 * En las entidades del dominio, usamos `Date`.
 * En los DTOs (Firestore shapes), usamos `FirestoreTimestamp`.
 */

export interface FirestoreTimestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
}

export interface FirestoreTimestamps {
  readonly createdAt: FirestoreTimestamp;
  readonly updatedAt: FirestoreTimestamp;
}

export interface DomainDates {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface DateMetadata extends DomainDates {
  readonly createdBy: string;
}
