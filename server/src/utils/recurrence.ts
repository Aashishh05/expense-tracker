import Recurring, { type RecurringDocument, type RecurringFrequency } from '../models/Recurring';
import Transaction from '../models/Transaction';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The furthest a catch-up sweep will look back per rule (240 daily
 * occurrences ≈ 8 months of backfill; monthly → 240 months, plenty).
 * Prevents an ancient startDate from looping forever.
 */
const MAX_CATCH_UP = 240;

/**
 * Advance one occurrence, calendar-aware for months:
 * 2026-01-31 + monthly → 2026-02-28 (day clamped to the month's length).
 */
export function nextOccurrence(date: Date, frequency: RecurringFrequency): Date {
  switch (frequency) {
    case 'daily':
      return new Date(date.getTime() + DAY_MS);
    case 'weekly':
      return new Date(date.getTime() + 7 * DAY_MS);
    case 'monthly': {
      const moved = new Date(date.getTime());
      const day = moved.getUTCDate();
      moved.setUTCDate(1);
      moved.setUTCMonth(moved.getUTCMonth() + 1);
      const daysInMonth = new Date(Date.UTC(moved.getUTCFullYear(), moved.getUTCMonth() + 1, 0)).getUTCDate();
      moved.setUTCDate(Math.min(day, daysInMonth));
      return moved;
    }
  }
}

/** Whether an occurrence date is inside the rule's end boundary (inclusive). */
function pastEndDate(recurring: RecurringDocument, date: Date): boolean {
  return recurring.endDate !== null && recurring.endDate !== undefined && date.getTime() > recurring.endDate.getTime();
}

/**
 * Creates one Transaction per pending occurrence until everything is
 * materialized. Mutates nextRunAt/lastRunAt/active — the caller saves.
 * Returns the number of transactions created.
 */
export async function materializeRule(recurring: RecurringDocument, now: Date): Promise<number> {
  let created = 0;

  while (recurring.nextRunAt.getTime() <= now.getTime() && created < MAX_CATCH_UP) {
    if (pastEndDate(recurring, recurring.nextRunAt)) {
      recurring.active = false;
      break;
    }

    await Transaction.create({
      user: recurring.user,
      type: recurring.type,
      amount: recurring.amount,
      category: recurring.category,
      date: new Date(recurring.nextRunAt),
      note: recurring.note,
      recurring: recurring._id,
    });

    created += 1;
    recurring.lastRunAt = new Date(recurring.nextRunAt);
    recurring.nextRunAt = nextOccurrence(recurring.nextRunAt, recurring.frequency);
  }

  if (recurring.active && pastEndDate(recurring, recurring.nextRunAt)) {
    recurring.active = false;
  }
  return created;
}

let sweeping = false;

/**
 * Processes every due recurring rule across all users.
 * Idempotent: safe to call at boot and on an interval — the in-process
 * lock stops overlapping sweeps, and the (user, recurring, date) unique
 * index on transactions stops double inserts at the edge.
 */
export async function processDueRecurrences(): Promise<number> {
  if (sweeping) return 0;
  sweeping = true;
  try {
    const now = new Date();
    const due = await Recurring.find({ active: true, nextRunAt: { $lte: now } })
      .sort({ nextRunAt: 1 })
      .limit(200);

    let created = 0;
    for (const recurring of due) {
      try {
        created += await materializeRule(recurring, now);
        await recurring.save();
      } catch (err) {
        // One bad rule must not block the rest of the sweep.
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Recurring rule skipped (${recurring._id}): ${message}`);
      }
    }
    return created;
  } finally {
    sweeping = false;
  }
}
