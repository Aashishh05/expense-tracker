import fs from 'fs';
import Transaction from '../models/Transaction';
import Category, { type CategoryDocument } from '../models/Category';
import asyncHandler from '../utils/asyncHandler';
import { dateFilterFromRange } from '../utils/dates';
import { deleteReceiptFile, receiptPath } from '../utils/receipts';
import { resolveMemberGroup } from '../utils/groups';
import type { Request } from 'express';
import type { FilterQuery, Types } from 'mongoose';
import type { ITransaction } from '../models/Transaction';
import type { CategoryType } from '../models/Category';

const CATEGORY_FIELDS = 'name type color icon';

/** Verify the category is a default (user: null) or belongs to the user. */
async function resolveCategory(
  categoryId: string,
  userId: Types.ObjectId
): Promise<CategoryDocument | null> {
  return Category.findOne({ _id: categoryId, $or: [{ user: userId }, { user: null }] });
}

function escapeRegExp(value: string): string {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface SortSpec {
  [field: string]: 1 | -1;
}

function buildSort(sortParam: unknown): SortSpec {
  const allowed = ['date', 'amount', 'createdAt'];
  const raw = typeof sortParam === 'string' ? sortParam : '-date';
  const desc = raw.startsWith('-');
  const field = raw.replace(/^-/, '');
  if (!allowed.includes(field)) return { date: -1 };
  return { [field]: desc ? -1 : 1 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Shared filter build for the list endpoint and the CSV export. */
function buildListFilter(req: Request): FilterQuery<ITransaction> {
  const { type, category, search } = req.query as Record<string, string | undefined>;

  const filter: FilterQuery<ITransaction> = { user: req.user._id };
  if (type) filter.type = type as CategoryType;
  if (category) filter.category = category;
  if (search) filter.note = new RegExp(escapeRegExp(search), 'i');

  const dateFilter = dateFilterFromRange(req.query.startDate, req.query.endDate);
  if (dateFilter) filter.date = dateFilter;
  return filter;
}

// GET /api/transactions?type=&category=&startDate=&endDate=&search=&sort=&page=&limit=
export const list = asyncHandler(async (req, res) => {
  const { sort } = req.query as Record<string, string | undefined>;
  const page = clamp(Number(req.query.page) || 1, 1, 10000);
  const limit = clamp(Number(req.query.limit) || 10, 1, 100);
  const skip = (page - 1) * limit;

  const filter = buildListFilter(req);

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

/** Escapes one CSV field (commas, quotes, newlines). */
function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// GET /api/transactions/export — CSV download honoring the same filters as list.
export const exportCsv = asyncHandler(async (req, res) => {
  const items = await Transaction.find(buildListFilter(req))
    .populate('category', CATEGORY_FIELDS)
    .sort(buildSort(req.query.sort))
    .limit(10000)
    .lean();

  const rows: string[] = ['Date,Type,Category,Amount,Note'];
  for (const item of items) {
    const category = item.category as unknown as { name?: string } | undefined;
    rows.push(
      [
        csvCell((item.date as Date).toISOString().slice(0, 10)),
        csvCell(item.type),
        csvCell(category?.name ?? ''),
        csvCell(item.amount),
        csvCell(item.note ?? ''),
      ].join(',')
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="transactions-${today}.csv"`);
  // A leading BOM keeps Excel reading the file as UTF-8.
  res.send(`\uFEFF${rows.join('\r\n')}\r\n`);
});

// POST /api/transactions
export const create = asyncHandler(async (req, res) => {
  const { type, amount, category, date, note, group } = req.body as {
    type: CategoryType;
    amount: number;
    category: string;
    date?: Date;
    note?: string;
    group?: string;
  };

  const categoryDoc = await resolveCategory(category, req.user._id);
  if (!categoryDoc) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'category', msg: 'Category not found' }],
    });
  }

  // Shared group expense: the caller must be a member and entries are
  // always expenses (income never needs splitting).
  let groupRef: Types.ObjectId | undefined;
  if (group) {
    const groupDoc = await resolveMemberGroup(group, req.user._id);
    if (!groupDoc) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'group', msg: 'Group not found — are you a member?' }],
      });
    }
    if (type !== 'expense') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'group', msg: 'Group transactions are expenses only' }],
      });
    }
    groupRef = groupDoc._id;
  }

  const transaction = await Transaction.create({
    user: req.user._id,
    type,
    amount,
    category,
    ...(date !== undefined && { date }),
    ...(note !== undefined && { note }),
    ...(groupRef !== undefined && { group: groupRef }),
  });

  await transaction.populate('category', CATEGORY_FIELDS);

  res.status(201).json({ success: true, message: 'Transaction added', data: transaction });
});

// GET /api/transactions/:id
export const getOne = asyncHandler(async (req, res) => {
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
export const update = asyncHandler(async (req, res) => {
  const { type, amount, category, date, note, group } = req.body as {
    type?: CategoryType;
    amount?: number;
    category?: string;
    date?: Date;
    note?: string;
    group?: string;
  };

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
    transaction.category = category as unknown as Types.ObjectId;
  }

  if (type !== undefined) transaction.type = type;
  if (amount !== undefined) transaction.amount = amount;
  if (date !== undefined) transaction.date = date;
  if (note !== undefined) transaction.note = note;

  if (group !== undefined) {
    const groupDoc = await resolveMemberGroup(group, req.user._id);
    if (!groupDoc) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'group', msg: 'Group not found — are you a member?' }],
      });
    }
    transaction.group = groupDoc._id;
  }

  // A shared entry can only ever be an expense.
  if (transaction.group && transaction.type !== 'expense') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'group', msg: 'Group transactions are expenses only' }],
    });
  }

  await transaction.save(); // full schema validation on update
  await transaction.populate('category', CATEGORY_FIELDS);

  res.json({ success: true, message: 'Transaction updated', data: transaction });
});

// DELETE /api/transactions/:id
export const remove = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  // Clean up any uploaded receipt from disk.
  deleteReceiptFile(transaction.receipt);

  res.json({
    success: true,
    message: 'Transaction deleted',
    data: { _id: transaction._id },
  });
});

// POST /api/transactions/:id/receipt (multipart field: receipt)
export const uploadReceipt = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No receipt file was received' });
  }

  // Replacing an existing receipt removes its file first.
  deleteReceiptFile(transaction.receipt);
  transaction.receipt = req.file.filename;
  await transaction.save();

  res.json({ success: true, message: 'Receipt uploaded', data: { receipt: true } });
});

// GET /api/transactions/:id/receipt — streams the file to the author, or to
// any member of the group the shared expense belongs to.
export const downloadReceipt = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id }).select('receipt user group');
  if (!transaction?.receipt) {
    return res.status(404).json({ success: false, message: 'No receipt attached to this transaction' });
  }

  const isAuthor = String(transaction.user) === String(req.user._id);
  let authorized = isAuthor;
  if (!authorized && transaction.group) {
    authorized = (await resolveMemberGroup(String(transaction.group), req.user._id)) !== null;
  }
  if (!authorized) {
    return res.status(403).json({ success: false, message: 'You do not have access to this receipt' });
  }

  const filePath = receiptPath(transaction.receipt);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Receipt file is missing on the server' });
  }

  res.sendFile(filePath);
});

// DELETE /api/transactions/:id/receipt
export const removeReceipt = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  if (!transaction.receipt) {
    return res.status(400).json({ success: false, message: 'No receipt attached to this transaction' });
  }

  deleteReceiptFile(transaction.receipt);
  transaction.receipt = undefined;
  await transaction.save();

  res.json({ success: true, message: 'Receipt removed', data: { receipt: false } });
});
