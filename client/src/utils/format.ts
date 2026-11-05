import type { Transaction, TransactionType } from '@/types';
import { convertFromBase } from './currency';

type ApiErrorResponse = {
  response?: {
    data?: {
      message?: string;
      errors?: Array<{ field: string; msg: string }>;
    };
  };
  message?: string;
};

/** Human-readable message from any axios/error object. */
export function apiMessage(error: unknown, fallback = 'Something went wrong'): string {
  const err = error as ApiErrorResponse;
  const message = err?.response?.data?.message;
  if (typeof message === 'string' && message) return message;
  if (err?.message === 'Network Error') return 'Cannot reach the server — is the API running?';
  if (typeof err?.message === 'string' && err.message) return err.message;
  return fallback;
}

/** Field-level errors returned by the API validation layer. */
export function apiFieldErrors(error: unknown): Array<{ field: string; msg: string }> {
  const err = error as ApiErrorResponse;
  const errors = err?.response?.data?.errors;
  return Array.isArray(errors) ? errors : [];
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Soft chip background derived from a hex color (12% alpha). */
export function softColor(hex: string | undefined): string {
  return hex ? `${hex}1f` : 'rgba(0,0,0,0.06)';
}

/**
 * Formats an amount for display, converting it from the NPR base into the
 * chosen display currency (identity when the display currency is NPR).
 */
export function formatCurrency(value: number, currency = 'NPR'): string {
  const converted = convertFromBase(value, currency);
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: Math.abs(converted) >= 1000 ? 0 : 2,
    }).format(converted);
  } catch {
    return `${currency} ${Number.isInteger(converted) ? converted : converted.toFixed(2)}`;
  }
}

/** Compact axis labels: 50,000 -> "50K" (converted from the NPR base first). */
export function compactNumber(value: number, currency = 'NPR'): string {
  const converted = convertFromBase(value, currency);
  try {
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(converted);
  } catch {
    return String(Math.round(converted));
  }
}

/** Dates are stored at UTC midnight — render in UTC to avoid off-by-one days. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  try {
    return new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return String(iso).slice(0, 10);
  }
}

/** "2026-11-25" -> today's date in the same format (local time). */
export function todayYMD(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

/** Current month key, "2026-11" (local time). */
export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

/** Last day of "2026-11" -> "2026-11-30". */
export function monthEndDay(monthKey: string): string {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return todayYMD();
  const [year, month] = monthKey.split('-').map(Number);
  const last = new Date(year, month, 0).getDate();
  return `${monthKey}-${String(last).padStart(2, '0')}`;
}

/** "Nov 2026" from "2026-11". */
export function monthLabel(monthKey: string): string {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return monthKey;
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
  } catch {
    return monthKey;
  }
}

/** Shift "2026-11" by n months (for prev/next month arrows). */
export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const shifted = new Date(year, month - 1 + delta, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}`;
}

export function categoryOf(transaction: Transaction, fallbackType: TransactionType): string {
  return typeof transaction.category === 'object' && transaction.category !== null
    ? transaction.category._id
    : fallbackType;
}
