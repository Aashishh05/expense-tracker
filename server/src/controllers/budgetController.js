const Budget = require('../models/Budget');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const { monthRange, currentMonthKey } = require('../utils/dates');

/** Verify the user can use this category (default or own) and it is an expense category. */
async function resolveExpenseCategory(categoryId, userId) {
  const category = await Category.findOne({
    _id: categoryId,
    $or: [{ user: userId }, { user: null }],
  });
  if (!category) return { error: 'Category not found' };
  if (category.type !== 'expense') return { error: 'Budgets can only be set for expense categories' };
  return { category };
}

// GET /api/budgets?month=2026-11
exports.list = asyncHandler(async (req, res) => {
  const month = req.query.month || currentMonthKey();
  const range = monthRange(month);

  const budgets = await Budget.find({ user: req.user._id, month }).populate(
    'category',
    'name type color icon'
  );

  const spentRows = await Transaction.aggregate([
    {
      $match: {
        user: req.user._id,
        type: 'expense',
        date: { $gte: range.start, $lt: range.end },
      },
    },
    { $group: { _id: '$category', spent: { $sum: '$amount' } } },
  ]);
  const spentMap = new Map(spentRows.map((r) => [String(r._id), r.spent]));

  const data = budgets.map((b) => {
    const spent = spentMap.get(String(b.category._id)) || 0;
    return {
      ...b.toObject(),
      spent,
      remaining: b.limit - spent,
      percent: b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0,
    };
  });

  res.json({ success: true, data, meta: { month } });
});

// POST /api/budgets  (create or upsert per user+category+month)
exports.create = asyncHandler(async (req, res) => {
  const { category: categoryId, month, limit } = req.body;

  const { category, error } = await resolveExpenseCategory(categoryId, req.user._id);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'category', msg: error }],
    });
  }

  const budget = await Budget.findOneAndUpdate(
    { user: req.user._id, category: categoryId, month },
    { $set: { limit } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true, context: 'query' }
  );

  res.status(201).json({
    success: true,
    message: 'Budget saved',
    data: { ...budget.toObject(), category },
  });
});

// PUT /api/budgets/:id
exports.update = asyncHandler(async (req, res) => {
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
exports.remove = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!budget) {
    return res.status(404).json({ success: false, message: 'Budget not found' });
  }

  res.json({ success: true, message: 'Budget deleted', data: { _id: budget._id } });
});
