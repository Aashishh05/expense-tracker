const DAY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Mongo date-range filter shape. */
export interface MongoDateFilter {
  $gte?: Date;
  $lt?: Date;
}

/** Parse a "YYYY-MM-DD" string into a UTC midnight Date, or null. */
export function parseDay(value: unknown): Date | null {
  if (!value || !DAY_REGEX.test(String(value))) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Exclusive end bound for an inclusive YYYY-MM-DD range. */
export function endOfDayExclusive(day: Date): Date {
  return new Date(day.getTime() + DAY_MS);
}

/** Build a Mongo date filter from optional startDate / endDate query params. */
export function dateFilterFromRange(startRaw: unknown, endRaw: unknown): MongoDateFilter | null {
  const start = parseDay(startRaw);
  const end = parseDay(endRaw);
  if (!start && !end) return null;
  const filter: MongoDateFilter = {};
  if (start) filter.$gte = start;
  if (end) filter.$lt = endOfDayExclusive(end);
  return filter;
}

/** "2026-11" -> { start, end, year, month } or null. */
export function monthRange(month: unknown): { start: Date; end: Date; year: number; month: number } | null {
  const value = String(month ?? '');
  if (!MONTH_REGEX.test(value)) return null;
  const [year, monthNum] = value.split('-').map(Number) as [number, number];
  return {
    start: new Date(Date.UTC(year, monthNum - 1, 1)),
    end: new Date(Date.UTC(year, monthNum, 1)),
    year,
    month: monthNum,
  };
}

/** Current month as "YYYY-MM" (UTC based). */
export function currentMonthKey(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** "2026" -> { start, end } or null. */
export function yearRange(year: unknown): { start: Date; end: Date } | null {
  const y = Number(year);
  if (!Number.isInteger(y) || y < 2000 || y > 2100) return null;
  return {
    start: new Date(Date.UTC(y, 0, 1)),
    end: new Date(Date.UTC(y + 1, 0, 1)),
  };
}

// Re-export the shared regexes and month labels for validators/controllers.
export { DAY_REGEX, MONTH_REGEX, MONTH_LABELS };
