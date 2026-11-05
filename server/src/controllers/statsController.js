const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const {
  MONTH_LABELS,
  dateFilterFromRange,
  monthRange,
  currentMonthKey,
  yearRange,
} = require('../utils/dates');

// GET /api/stats/summary?startDate=&endDate=
exports.summary = asyncHandler(async (req, res) => {
  const dateFilter = dateFilterFromRange(req.query.startDate, req.query.endDate);
  const match = {
    user: req.user._id,
    ...(dateFilter && { date: dateFilter }),
  };

  const rows = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  const summary = { income: 0, expense: 0, balance: 0, count: 0 };
  for (const row of rows) {
    summary[row._id] = row.total;
    summary.count += row.count;
  }
  summary.balance = summary.income - summary.expense;

  res.json({
    success: true,
    data: {
      ...summary,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
    },
  });
});

// GET /api/stats/by-category?type=expense&month=2026-11
exports.byCategory = asyncHandler(async (req, res) => {
  const type = req.query.type === 'income' ? 'income' : 'expense';
  const month = req.query.month || currentMonthKey();
  const range = monthRange(month);

  const data = await Transaction.aggregate([
    {
      $match: {
        user: req.user._id,
        type,
        date: { $gte: range.start, $lt: range.end },
      },
    },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $project: {
        _id: 1,
        total: 1,
        count: 1,
        name: '$category.name',
        color: '$category.color',
        icon: '$category.icon',
      },
    },
  ]);

  res.json({ success: true, data, meta: { month, type } });
});

// GET /api/stats/monthly?year=2026
exports.monthly = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getUTCFullYear();
  const range = yearRange(year);
  const resolvedYear = yearRange(year) ? year : new Date().getUTCFullYear();

  const rows = await Transaction.aggregate([
    {
      $match: {
        user: req.user._id,
        date: { $gte: range.start, $lt: range.end },
      },
    },
    {
      $group: {
        _id: { $month: '$date' },
        income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byMonth = new Map(rows.map((r) => [r._id, r]));
  const months = MONTH_LABELS.map((label, i) => {
    const row = byMonth.get(i + 1);
    return {
      month: i + 1,
      label,
      income: row ? row.income : 0,
      expense: row ? row.expense : 0,
    };
  });

  res.json({ success: true, data: { year: resolvedYear, months } });
});
