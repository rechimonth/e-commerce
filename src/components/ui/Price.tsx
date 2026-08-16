import type { Money, CurrencyCode } from '@/types/pricing';

export interface PriceProps {
  readonly amount: Money | number;
  readonly currency?: CurrencyCode;
  readonly className?: string;
  readonly locale?: string;
}

export function Price({ amount, currency = 'USD', className = '', locale = 'en-US' }: PriceProps) {
  const price = typeof amount === 'number' ? amount : amount.amount;
  const cur = typeof amount === 'number' ? currency : amount.currency;
  const formatted = (price / 100).toLocaleString(locale, {
    style: 'currency',
    currency: cur,
  });

  return <span className={className}>{formatted}</span>;
}

export default Price;
export const formatPrice = Price;
