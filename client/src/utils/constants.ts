import type { TransactionType } from '@/types';

/** Fallback chart palette for categories without a color. */
export const CHART_COLORS = [
  '#0071e3',
  '#f59e0b',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#ec4899',
  '#22c55e',
  '#6366f1',
] as const;

/** Palette offered when creating a custom category. */
export const SWATCH_COLORS = [
  '#0071e3',
  '#f59e0b',
  '#ec4899',
  '#22c55e',
  '#8b5cf6',
  '#14b8a6',
  '#ef4444',
  '#64748b',
] as const;

export const CURRENCIES: Array<{ code: string; name: string }> = [
  { code: 'NPR', name: 'Nepalese Rupee' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'QAR', name: 'Qatari Riyal' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'BDT', name: 'Bangladeshi Taka' },
  { code: 'LKR', name: 'Sri Lankan Rupee' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'ZAR', name: 'South African Rand' },
];

export const TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Income',
  expense: 'Expense',
};

/** Soft chip background derived from a hex color (12% alpha). */
export function softColor(hex: string | undefined): string {
  return hex ? `${hex}1f` : 'rgba(0,0,0,0.06)';
}
