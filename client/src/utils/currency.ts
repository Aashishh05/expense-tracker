/**
 * Display currency conversion.
 *
 * Amounts are stored (and typed by the user) in the base currency, NPR.
 * Every displayed amount is converted at render time using the static
 * snapshot below — no external API call at runtime, fully deterministic.
 *
 * To refresh the rates, grab a new snapshot from open.er-api.com
 * (base NPR), update RATES and RATE_DATE.
 */
export const BASE_CURRENCY = 'NPR';

/** Target-currency units per 1 NPR. Snapshot: 2026-11-05 (open.er-api.com). */
export const RATES: Record<string, number> = {
  NPR: 1,
  USD: 0.006605,
  EUR: 0.005882,
  GBP: 0.004903,
  INR: 0.625,
  AUD: 0.009431,
  CAD: 0.009223,
  JPY: 1.046726,
  CNY: 0.044013,
  CHF: 0.005396,
  SGD: 0.008447,
  AED: 0.024258,
  SAR: 0.02477,
  QAR: 0.024043,
  SEK: 0.064388,
  NZD: 0.011742,
  KRW: 8.854294,
  THB: 0.222244,
  MYR: 0.026858,
  PHP: 0.419337,
  IDR: 119.760241,
  PKR: 1.827196,
  BDT: 0.821878,
  LKR: 2.19363,
  BRL: 0.036186,
  ZAR: 0.108614,
};

/** When the snapshot was taken — shown in the UI so conversions aren't misleading. */
export const RATE_DATE = '2026-11-05';

/** NPR amount → the display currency's amount (identity for NPR or unknown codes). */
export function convertFromBase(amount: number, currency = BASE_CURRENCY): number {
  const rate = RATES[currency];
  if (!rate || rate === 1) return amount;
  return amount * rate;
}
