import Group, { type GroupDocument } from '../models/Group';
import Transaction from '../models/Transaction';
import User from '../models/User';
import asyncHandler from '../utils/asyncHandler';
import { resolveMemberGroup, planSettlement } from '../utils/groups';
import { dateFilterFromRange } from '../utils/dates';
import type { Request } from 'express';
import type { FilterQuery, Types } from 'mongoose';
import type { ITransaction } from '../models/Transaction';
import type { CategoryType } from '../models/Category';

const MEMBER_FIELDS = 'name email';
const CATEGORY_FIELDS = 'name type color icon';
const MAX_MEMBERS = 12;

/** True when the requester owns the group (rename/delete/invite). */
function isOwner(group: GroupDocument, req: Request): boolean {
  return String(group.owner) === String(req.user._id);
}

// GET /api/groups
export const list = asyncHandler(async (req, res) => {
  const groups = await Group.find({ 'members.user': req.user._id })
    .populate('members.user', MEMBER_FIELDS)
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: groups });
});

// POST /api/groups
export const create = asyncHandler(async (req, res) => {
  const { name } = req.body as { name: string };

  const group = await Group.create({
    name,
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'owner', joinedAt: new Date() }],
  });

  const populated = await Group.findById(group._id).populate('members.user', MEMBER_FIELDS);

  res.status(201).json({ success: true, message: 'Group created', data: populated });
});

// GET /api/groups/:id
export const detail = asyncHandler(async (req, res) => {
  const group = await resolveMemberGroup(String(req.params.id), req.user._id);
  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  await group.populate('members.user', MEMBER_FIELDS);
  res.json({ success: true, data: group });
});

// GET /api/groups/:id/stats — totals, per-member balances and settle-up plan
export const stats = asyncHandler(async (req, res) => {
  const group = await resolveMemberGroup(String(req.params.id), req.user._id);
  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  await group.populate('members.user', MEMBER_FIELDS);

  const [totalAgg, payerAgg] = await Promise.all([
    Transaction.aggregate([
      { $match: { group: group._id } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { group: group._id } },
      { $group: { _id: '$user', paid: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  const total = Math.round((totalAgg[0]?.total ?? 0) * 100) / 100;
  const count = totalAgg[0]?.count ?? 0;

  const paidBy = new Map<string, { paid: number; count: number }>();
  for (const row of payerAgg) {
    paidBy.set(String(row._id), { paid: row.paid, count: row.count });
  }

  const share = group.members.length > 0 ? total / group.members.length : 0;

  const members = group.members.map((member) => {
    const userDoc = member.user as unknown as { _id: Types.ObjectId; name: string; email: string };
    const paidInfo = paidBy.get(String(userDoc._id)) ?? { paid: 0, count: 0 };
    const round = (value: number) => Math.round(value * 100) / 100;
    return {
      user: { _id: String(userDoc._id), name: userDoc.name, email: userDoc.email },
      role: member.role,
      count: paidInfo.count,
      paid: round(paidInfo.paid),
      share: round(share),
      net: round(paidInfo.paid - share),
    };
  });

  const settle = planSettlement(
    members.filter((m) => Math.abs(m.net) > 0.005).map((m) => ({ id: m.user._id, name: m.user.name, net: m.net }))
  );

  res.json({ success: true, data: { total, count, members, settle } });
});

// PUT /api/groups/:id  { name } (owner only)
export const update = asyncHandler(async (req, res) => {
  const group = await resolveMemberGroup(String(req.params.id), req.user._id);
  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }
  if (!isOwner(group, req)) {
    return res.status(403).json({ success: false, message: 'Only the group owner can rename it' });
  }

  group.name = req.body.name as string;
  await group.save();
  await group.populate('members.user', MEMBER_FIELDS);

  res.json({ success: true, message: 'Group renamed', data: group });
});

// DELETE /api/groups/:id  (owner only; transactions detach and stay)
export const remove = asyncHandler(async (req, res) => {
  const group = await resolveMemberGroup(String(req.params.id), req.user._id);
  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }
  if (!isOwner(group, req)) {
    return res.status(403).json({ success: false, message: 'Only the group owner can delete the group' });
  }

  const groupId = group._id;
  await group.deleteOne();
  await Transaction.updateMany({ group: groupId }, { $unset: { group: '' } });

  res.json({
    success: true,
    message: 'Group deleted — its transactions were kept as personal entries',
    data: { _id: groupId },
  });
});

// POST /api/groups/:id/members  { email } (owner only)
export const addMember = asyncHandler(async (req, res) => {
  const group = await resolveMemberGroup(String(req.params.id), req.user._id);
  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }
  if (!isOwner(group, req)) {
    return res.status(403).json({ success: false, message: 'Only the group owner can add members' });
  }
  if (group.members.length >= MAX_MEMBERS) {
    return res.status(400).json({ success: false, message: `A group can have at most ${MAX_MEMBERS} members` });
  }

  const { email } = req.body as { email: string };
  const user = await User.findOne({ email }).select('name email');
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'email', msg: 'No Expense Tracker account uses that email yet' }],
    });
  }
  if (group.members.some((member) => String(member.user) === String(user._id))) {
    return res.status(409).json({ success: false, message: 'That person is already in this group' });
  }

  group.members.push({ user: user._id, role: 'member', joinedAt: new Date() });
  await group.save();
  await group.populate('members.user', MEMBER_FIELDS);

  res.json({ success: true, message: 'Member added', data: group });
});

const SORTS: Record<string, { date: 1 | -1 } | { amount: 1 | -1 }> = {
  date: { date: 1 },
  '-date': { date: -1 },
  amount: { amount: 1 },
  '-amount': { amount: -1 },
};

// GET /api/groups/:id/transactions — the group's shared expense feed
export const listTransactions = asyncHandler(async (req, res) => {
  const group = await resolveMemberGroup(String(req.params.id), req.user._id);
  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  const { type, sort } = req.query as Record<string, string | undefined>;
  const page = Math.min(Math.max(Number(req.query.page) || 1, 1), 10000);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<ITransaction> = { group: group._id };
  if (type) filter.type = type as CategoryType;
  const dateFilter = dateFilterFromRange(req.query.startDate, req.query.endDate);
  if (dateFilter) filter.date = dateFilter;

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .populate('category', CATEGORY_FIELDS)
      .populate('user', MEMBER_FIELDS)
      .sort(SORTS[sort ?? '-date'] ?? { date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});
