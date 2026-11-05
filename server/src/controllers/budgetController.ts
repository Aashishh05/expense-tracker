import Budget from '../models/Budget';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import asyncHandler from '../utils/asyncHandler';
import { monthRange, currentMonthKey } from '../utils/dates';
import type { Types } from 'mongoose';
import type { BudgetDocument } from '../models/Budget';
import type { CategoryDocument } from '../models/Category';

interface SpentRow {
  _id: Types.ObjectId | null;
  spent: number;
}

/** Verify the user can use this category (default or own) and it is an expense category. */
async function resolveExpenseCategory(
  categoryId: string,
  userId: Types.ObjectId
): Promise<{ category?: CategoryDocument; error?: string }> {
  const category = await Category.findOne({
    _id: categoryId,
    $or: [{ user: userId }, { user: null }],
  });
  if (!category) return { error: 'Category not found' };
  if (category.type !== 'expense') return { error: 'Budgets can only be set for expense categories' };
  return { category };
}

// GET /api/budgets?month=2026-11
export const list = asyncHandler(async (req, res) => {
  const month = (req.query.month as string) || currentMonthKey();
  const range = monthRange(month);
  if (!range) {
    return res.status(400).json({ success: false, message: 'Invalid month' });
  }

  const budgets = await Budget.find({ user: req.user._id, month }).populate(
    'category',
    'name type color icon'
  );

  const spentRows = await Transaction.aggregate<SpentRow>([
    {
      $match: {
        user: req.user._id,
        type: 'expense',
        date: { $gte: range.start, $lt: range.end },
      },
    },
    { $group: { _id: '$category', spent: { $sum: '$amount' } } },
  ]);
  const spentMap = new Map<string, number>(
    spentRows.map((r): [string, number] => [String(r._id), r.spent])
  );

  const data = budgets.map((b) => {
    const budget = b as unknown as BudgetDocument & { category: CategoryDocument };
    const spent = spentMap.get(String(budget.category._id)) || 0;
    return {
      ...budget.toObject(),
      spent,
      remaining: budget.limit - spent,
      percent: budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0,
    };
  });

  res.json({ success: true, data, meta: { month } });
});

// POST /api/budgets  (create or upsert per user+category+month)
export const create = asyncHandler(async (req, res) => {
  const { category: categoryId, month, limit } = req.body;

  const { category, error } = await resolveExpenseCategory(categoryId, req.user._id);
  if (error || !category) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'category', msg: error ?? 'Category not found' }],
    });
  }

  const budget = await Budget.findOneAndUpdate(
    { user: req.user._id, category: categoryId, month },
    { $set: { limit } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true, context: 'query' }
  );
  if (!budget) {
    return res.status(500).json({ success: false, message: 'Could not save the budget' });
  }

  res.status(201).json({
    success: true,
    message: 'Budget saved',
    data: { ...budget.toObject(), category },
  });
});

// PUT /api/budgets/:id
export const update = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { limit: req.body.limit } },
    { new: true, runValidators: true, context: 'query' }
  ).populate('category', 'name type color icon');

  if (!budget) {
    return res.status(404).json({ success: false, message: 'Budget not found' });
  }

  res.json({ success: true, message: 'Budget updated', data: budget });
});

// DELETE /api/budgets/:id
export const remove = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!budget) {
    return res.status(404).json({ success: false, message: 'Budget not found' });
  }

  res.json({ success: true, message: 'Budget deleted', data: { _id: budget._id } });
});
