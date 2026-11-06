import Category from '../models/Category';
import type { AnyBulkWriteOperation } from 'mongoose';
import type { CategoryDocument, CategoryType } from '../models/Category';

/**
 * Shared default categories. Stored once with `user: null`
 * and available (read-only) to every user.
 */
export interface DefaultCategory {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Income
  { name: 'Salary', type: 'income', icon: 'briefcase', color: '#0ea5e9' },
  { name: 'Freelance', type: 'income', icon: 'laptop', color: '#8b5cf6' },
  { name: 'Investment', type: 'income', icon: 'trending-up', color: '#14b8a6' },
  { name: 'Gift', type: 'income', icon: 'gift', color: '#f472b6' },
  { name: 'Other Income', type: 'income', icon: 'banknote', color: '#84cc16' },
  // Expense
  { name: 'Food & Drink', type: 'expense', icon: 'utensils', color: '#f59e0b' },
  { name: 'Rent', type: 'expense', icon: 'house', color: '#6366f1' },
  { name: 'Utilities', type: 'expense', icon: 'lightbulb', color: '#0ea5e9' },
  { name: 'Transport', type: 'expense', icon: 'bus', color: '#22c55e' },
  { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#ec4899' },
  { name: 'Health', type: 'expense', icon: 'heart-pulse', color: '#ef4444' },
  { name: 'Education', type: 'expense', icon: 'graduation-cap', color: '#a855f7' },
  { name: 'Entertainment', type: 'expense', icon: 'clapperboard', color: '#f97316' },
  { name: 'Other', type: 'expense', icon: 'receipt', color: '#64748b' },
];

/** Idempotently upsert the default categories (refreshes icon/color of existing docs). */
export async function ensureDefaultCategories(): Promise<void> {
  const ops = DEFAULT_CATEGORIES.map<AnyBulkWriteOperation<CategoryDocument>>(
    ({ name, type, icon, color }) => ({
      updateOne: {
        filter: { user: null, name, type },
        update: { $set: { icon, color }, $setOnInsert: { user: null, name, type } },
        upsert: true,
      },
    })
  );
  await Category.bulkWrite(ops, { ordered: true });
}
