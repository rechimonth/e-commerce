/**
 * Tipos de precios y monedas.
 *
 * Estrategia: todos los precios se almacenan como enteros en centavos
 * (unidades menores de la moneda) para evitar errores de punto flotante.
 * La conversión a/from centavos ocurre solo en la capa de presentación/utils.
 *
 * Ejemplo: $99.99 → 9999 centavos
 */

export const SUPPORTED_CURRENCIES = ['USD', 'MXN', 'EUR', 'GBP', 'CAD'] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export interface Money {
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export type Price = Money;

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

export interface MoneyInput {
  readonly dollars: number;
  readonly cents: number;
  readonly currency: CurrencyCode;
}

export const CENTS_PER_DOLLAR = 100;

export function cents(dollars: number): number {
  return Math.round(dollars * CENTS_PER_DOLLAR);
}

export function dollars(cents: number): number {
  return Math.round(cents) / CENTS_PER_DOLLAR;
}

export function money(dollars: number, currency: CurrencyCode = DEFAULT_CURRENCY): Money {
  return { amount: cents(dollars), currency };
}

export function moneyFromCents(amount: number, currency: CurrencyCode = DEFAULT_CURRENCY): Money {
  return { amount, currency };
}

export function formatMoney(m: Money, locale = 'es-MX'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: m.currency,
    minimumFractionDigits: 2,
  }).format(dollars(m.amount));
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add money with different currencies: ${a.currency} vs ${b.currency}`);
  }
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(
      `Cannot subtract money with different currencies: ${a.currency} vs ${b.currency}`,
    );
  }
  return { amount: a.amount - b.amount, currency: a.currency };
}

export function multiplyMoney(m: Money, multiplier: number): Money {
  if (multiplier < 0) {
    throw new Error('Multiplier must be non-negative');
  }
  return { amount: Math.round(m.amount * multiplier), currency: m.currency };
}

export function moneyToString(m: Money): string {
  return `${dollars(m.amount).toFixed(2)} ${m.currency}`;
}
