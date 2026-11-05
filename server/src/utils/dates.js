const DAY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse a "YYYY-MM-DD" string into a UTC midnight Date, or null. */
function parseDay(value) {
  if (!value || !DAY_REGEX.test(String(value))) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Exclusive end bound for an inclusive YYYY-MM-DD range. */
function endOfDayExclusive(day) {
  return new Date(day.getTime() + DAY_MS);
}

/** Build a Mongo date filter from optional startDate / endDate query params. */
function dateFilterFromRange(startRaw, endRaw) {
  const start = parseDay(startRaw);
  const end = parseDay(endRaw);
  if (!start && !end) return null;
  const filter = {};
  if (start) filter.$gte = start;
  if (end) filter.$lt = endOfDayExclusive(end);
  return filter;
}

/** "2026-11" -> { start, end, year, month } or null. */
function monthRange(month) {
  const value = String(month || '');
  if (!MONTH_REGEX.test(value)) return null;
  const [year, monthNum] = value.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, monthNum - 1, 1)),
    end: new Date(Date.UTC(year, monthNum, 1)),
    year,
    month: monthNum,
  };
}

/** Current month as "YYYY-MM" (UTC based). */
function currentMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** "2026" -> { start, end } or null. */
function yearRange(year) {
  const y = Number(year);
  if (!Number.isInteger(y) || y < 2000 || y > 2100) return null;
  return {
    start: new Date(Date.UTC(y, 0, 1)),
    end: new Date(Date.UTC(y + 1, 0, 1)),
  };
}

module.exports = {
  DAY_REGEX,
  MONTH_REGEX,
  MONTH_LABELS,
  parseDay,
  endOfDayExclusive,
  dateFilterFromRange,
  monthRange,
  currentMonthKey,
  yearRange,
};
