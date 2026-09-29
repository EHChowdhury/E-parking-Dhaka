import { BANGLADESH_CURRENCY } from '../config/constants';

/**
 * Format a numeric amount to Bangladesh Taka representation
 * e.g. 1500 -> "৳1,500"
 */
export function formatBDT(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${BANGLADESH_CURRENCY}0`;
  }

  // Format with thousands separator
  const rounded = Math.round(amount * 100) / 100;
  const parts = rounded.toFixed(rounded % 1 === 0 ? 0 : 2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${BANGLADESH_CURRENCY}${parts.join('.')}`;
}

/**
 * Format unit price with suffix e.g. "৳60/hr"
 */
export function formatPriceRate(
  amount: number | null | undefined,
  type: 'hourly' | 'daily' | 'weekly' | 'monthly'
): string {
  if (amount === null || amount === undefined) return 'N/A';
  const suffixes: Record<string, string> = {
    hourly: '/hr',
    daily: '/day',
    weekly: '/wk',
    monthly: '/mo',
  };
  return `${formatBDT(amount)}${suffixes[type] || ''}`;
}
