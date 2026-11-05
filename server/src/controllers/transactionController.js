const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { dateFilterFromRange } = require('../utils/dates');

const CATEGORY_FIELDS = 'name type color icon';

/** Verify the category is a default (user: null) or belongs to the user. */
async function resolveCategory(categoryId, userId) {
  return Category.findOne({ _id: categoryId, $or: [{ user: userId }, { user: null }] });
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSort(sortParam) {
  const allowed = ['date', 'amount', 'createdAt'];
  const raw = typeof sortParam === 'string' ? sortParam : '-date';
  const desc = raw.startsWith('-');
  const field = raw.replace(/^-/, '');
  if (!allowed.includes(field)) return { date: -1 };
  return { [field]: desc ? -1 : 1 };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// GET /api/transactions?type=&category=&startDate=&endDate=&search=&sort=&page=&limit=
exports.list = asyncHandler(async (req, res) => {
  const { type, category, search, sort } = req.query;
  const page = clamp(Number(req.query.page) || 1, 1, 10000);
  const limit = clamp(Number(req.query.limit) || 10, 1, 100);
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (search) filter.note = new RegExp(escapeRegExp(search), 'i');

  const dateFilter = dateFilterFromRange(req.query.startDate, req.query.endDate);
  if (dateFilter) filter.date = dateFilter;

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .populate('category', CATEGORY_FIELDS)
      .sort(buildSort(sort))
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

// POST /api/transactions
exports.create = asyncHandler(async (req, res) => {
  const { type, amount, category, date, note } = req.body;

  const categoryDoc = await resolveCategory(category, req.user._id);
  if (!categoryDoc) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'category', msg: 'Category not found' }],
    });
  }

  const transaction = await Transaction.create({
    user: req.user._id,
    type,
    amount,
    category,
    ...(date !== undefined && { date }),
    ...(note !== undefined && { note }),
  });

  await transaction.populate('category', CATEGORY_FIELDS);

  res.status(201).json({ success: true, message: 'Transaction added', data: transaction });
});

// GET /api/transactions/:id
exports.getOne = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate('category', CATEGORY_FIELDS);

  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  res.json({ success: true, data: transaction });
});

// PUT /api/transactions/:id
exports.update = asyncHandler(async (req, res) => {
  const { type, amount, category, date, note } = req.body;

  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  if (category !== undefined) {
    const categoryDoc = await resolveCategory(category, req.user._id);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'category', msg: 'Category not found' }],
      });
    }
    transaction.category = category;
  }

  if (type !== undefined) transaction.type = type;
  if (amount !== undefined) transaction.amount = amount;
  if (date !== undefined) transaction.date = date;
  if (note !== undefined) transaction.note = note;

  await transaction.save(); // full schema validation on update
  await transaction.populate('category', CATEGORY_FIELDS);

  res.json({ success: true, message: 'Transaction updated', data: transaction });
});

// DELETE /api/transactions/:id
exports.remove = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  res.json({
    success: true,
    message: 'Transaction deleted',
    data: { _id: transaction._id },
  });
});
