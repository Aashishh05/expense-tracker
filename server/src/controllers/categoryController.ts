import Category from '../models/Category';
import Transaction from '../models/Transaction';
import asyncHandler from '../utils/asyncHandler';
import type { Types } from 'mongoose';

interface UsageRow {
  _id: Types.ObjectId | null;
  count: number;
}

// GET /api/categories
export const list = asyncHandler(async (req, res) => {
  const [categories, usage] = await Promise.all([
    Category.find({ $or: [{ user: req.user._id }, { user: null }] })
      .sort({ name: 1 })
      .lean(),
    Transaction.aggregate<UsageRow>([
      { $match: { user: req.user._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);

  const usageMap = new Map<string, number>(usage.map((u) => [String(u._id), u.count]));
  const data = categories.map((c) => ({
    ...c,
    usageCount: usageMap.get(String(c._id)) || 0,
    isDefault: !c.user,
  }));

  res.json({ success: true, data });
});

// POST /api/categories
export const create = asyncHandler(async (req, res) => {
  const { name, type, icon, color } = req.body;

  const duplicate = await Category.findOne({ user: req.user._id, name, type }).lean();
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: `You already have a "${name}" category for this type`,
    });
  }

  const category = await Category.create({ user: req.user._id, name, type, icon, color });

  res.status(201).json({ success: true, message: 'Category created', data: category });
});

// PUT /api/categories/:id  (own custom categories only)
export const update = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  const { name, icon, color } = req.body;
  if (name !== undefined) category.name = name;
  if (icon !== undefined) category.icon = icon;
  if (color !== undefined) category.color = color;

  await category.save();

  res.json({ success: true, message: 'Category updated', data: category });
});

// DELETE /api/categories/:id  (own custom categories only, blocked if in use)
export const remove = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  const inUse = await Transaction.exists({ user: req.user._id, category: category._id });
  if (inUse) {
    return res.status(409).json({
      success: false,
      message: 'This category is used by transactions and cannot be deleted',
    });
  }

  await category.deleteOne();

  res.json({ success: true, message: 'Category deleted', data: { _id: category._id } });
});
