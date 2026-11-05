import Recurring, { type RecurringDocument, type IRecurring } from '../models/Recurring';
import Category, { type CategoryDocument } from '../models/Category';
import asyncHandler from '../utils/asyncHandler';
import { materializeRule, nextOccurrence } from '../utils/recurrence';
import type { FilterQuery, Types } from 'mongoose';
import type { Request } from 'express';
import type { CategoryType } from '../models/Category';

const CATEGORY_FIELDS = 'name type color icon';

/** Verify the category is a default (user: null) or belongs to the user. */
async function resolveCategory(
  categoryId: string,
  userId: Types.ObjectId
): Promise<CategoryDocument | null> {
  return Category.findOne({ _id: categoryId, $or: [{ user: userId }, { user: null }] });
}

/** Creates whatever is due right now for one rule, then persists it. */
async function flushRule(recurring: RecurringDocument): Promise<number> {
  const created = await materializeRule(recurring, new Date());
  await recurring.save();
  return created;
}

function savedMessage(created: number, fallback: string): string {
  if (created <= 0) return fallback;
  return `${fallback} · ${created} transaction${created === 1 ? '' : 's'} created`;
}

// GET /api/recurring?active=true|false
export const list = asyncHandler(async (req: Request, res) => {
  const { active } = req.query as Record<string, string | undefined>;

  const filter: FilterQuery<IRecurring> = { user: req.user._id };
  if (active === 'true') filter.active = true;
  if (active === 'false') filter.active = false;

  const items = await Recurring.find(filter)
    .populate('category', CATEGORY_FIELDS)
    .sort({ nextRunAt: 1 })
    .lean();

  res.json({ success: true, data: items });
});

// POST /api/recurring
export const create = asyncHandler(async (req: Request, res) => {
  const { type, amount, category, frequency, startDate, endDate, note } = req.body as {
    type: CategoryType;
    amount: number;
    category: string;
    frequency: RecurringDocument['frequency'];
    startDate: Date;
    endDate?: Date;
    note?: string;
  };

  const categoryDoc = await resolveCategory(category, req.user._id);
  if (!categoryDoc) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'category', msg: 'Category not found' }],
    });
  }

  const recurring = await Recurring.create({
    user: req.user._id,
    type,
    amount,
    category,
    frequency,
    startDate,
    endDate: endDate ?? undefined,
    note,
    nextRunAt: startDate,
  });

  // Materialize anything already due so the rule is visible immediately.
  const created = await flushRule(recurring);
  await recurring.populate('category', CATEGORY_FIELDS);

  res.status(201).json({
    success: true,
    message: savedMessage(created, 'Recurring rule saved'),
    data: recurring,
  });
});

// PUT /api/recurring/:id
export const update = asyncHandler(async (req: Request, res) => {
  const recurring = await Recurring.findOne({ _id: req.params.id, user: req.user._id });
  if (!recurring) {
    return res.status(404).json({ success: false, message: 'Recurring rule not found' });
  }

  const { type, amount, category, frequency, endDate, note, active } = req.body as {
    type?: CategoryType;
    amount?: number;
    category?: string;
    frequency?: RecurringDocument['frequency'];
    endDate?: Date | null;
    note?: string;
    active?: boolean;
  };

  if (category !== undefined) {
    const categoryDoc = await resolveCategory(category, req.user._id);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'category', msg: 'Category not found' }],
      });
    }
    recurring.category = category as unknown as Types.ObjectId;
  }
  if (type !== undefined) recurring.type = type;
  if (amount !== undefined) recurring.amount = amount;
  if (note !== undefined) recurring.note = note;
  // endDate: null (sent from a cleared input) intentionally un-ends the rule.
  if (endDate !== undefined) recurring.endDate = endDate ?? null;
  if (active !== undefined) recurring.active = active;

  if (frequency !== undefined && frequency !== recurring.frequency) {
    recurring.frequency = frequency;
    recurring.nextRunAt = nextOccurrence(recurring.lastRunAt ?? recurring.startDate, frequency);
  }

  const created = await flushRule(recurring);
  await recurring.populate('category', CATEGORY_FIELDS);

  res.json({
    success: true,
    message: savedMessage(created, 'Recurring rule updated'),
    data: recurring,
  });
});

// DELETE /api/recurring/:id  (already created transactions are kept)
export const remove = asyncHandler(async (req: Request, res) => {
  const recurring = await Recurring.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!recurring) {
    return res.status(404).json({ success: false, message: 'Recurring rule not found' });
  }

  res.json({
    success: true,
    message: 'Recurring rule deleted — already created transactions were kept',
    data: { _id: recurring._id },
  });
});
