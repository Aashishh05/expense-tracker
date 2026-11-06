import { body, query, param } from 'express-validator';
import { DAY_REGEX } from '../utils/dates';

const create = [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be income or expense'),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than 0')
    .toFloat(),
  body('category')
    .isMongoId()
    .withMessage('Invalid category'),
  body('date')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Enter a valid date (YYYY-MM-DD)')
    .toDate(),
  body('note')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Note must be at most 200 characters'),
  body('group')
    .optional({ values: 'falsy' })
    .isMongoId()
    .withMessage('Invalid group'),
];

const update = [
  body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be greater than 0').toFloat(),
  body('category').optional().isMongoId().withMessage('Invalid category'),
  body('date')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Enter a valid date (YYYY-MM-DD)')
    .toDate(),
  body('note')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Note must be at most 200 characters'),
  body('group')
    .optional({ values: 'falsy' })
    .isMongoId()
    .withMessage('Invalid group'),
];

const list = [
  query('type').optional().isIn(['income', 'expense']).withMessage('Invalid type filter'),
  query('category').optional().isMongoId().withMessage('Invalid category filter'),
  query('startDate')
    .optional()
    .matches(DAY_REGEX)
    .withMessage('startDate must be in YYYY-MM-DD format'),
  query('endDate')
    .optional()
    .matches(DAY_REGEX)
    .withMessage('endDate must be in YYYY-MM-DD format'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Search must be at most 120 characters'),
  query('sort')
    .optional()
    .isIn(['date', '-date', 'amount', '-amount', 'createdAt', '-createdAt'])
    .withMessage('Invalid sort field'),
  query('page').optional().isInt({ min: 1 }).withMessage('Invalid page').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit').toInt(),
];

const idParam = [param('id').isMongoId().withMessage('Invalid transaction id')];

export { create, update, list, idParam };
