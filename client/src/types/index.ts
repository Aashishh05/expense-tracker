export type TransactionType = 'income' | 'expense';

export interface User {
  _id: string;
  name: string;
  email: string;
  currency: string;
  createdAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  user?: string | null;
  usageCount?: number;
  isDefault?: boolean;
}

export interface Transaction {
  _id: string;
  type: TransactionType;
  amount: number;
  category: Category | null;
  date: string;
  note?: string;
  /** Present when this entry was auto-created by a recurring rule. */
  recurring?: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface Recurring {
  _id: string;
  type: TransactionType;
  amount: number;
  category: Category | null;
  note?: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string | null;
  nextRunAt: string;
  lastRunAt?: string | null;
  active: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface StatsSummary {
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface CategoryStat {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
  total: number;
  count: number;
}

export interface MonthlyStat {
  month: number;
  label: string;
  income: number;
  expense: number;
}

export interface Budget {
  _id: string;
  month: string;
  limit: number;
  category: Category | null;
  spent: number;
  remaining: number;
  percent: number;
}
