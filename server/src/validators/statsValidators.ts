import { query } from 'express-validator';
import { DAY_REGEX, MONTH_REGEX } from '../utils/dates';

const summary = [
  query('startDate')
    .optional()
    .matches(DAY_REGEX)
    .withMessage('startDate must be in YYYY-MM-DD format'),
  query('endDate')
    .optional()
    .matches(DAY_REGEX)
    .withMessage('endDate must be in YYYY-MM-DD format'),
];

const byCategory = [
  query('type').optional().isIn(['income', 'expense']).withMessage('Invalid type'),
  query('month')
    .optional()
    .matches(MONTH_REGEX)
    .withMessage('Month must be in YYYY-MM format'),
];

const monthly = [
  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100')
    .toInt(),
];

export { summary, byCategory, monthly };
