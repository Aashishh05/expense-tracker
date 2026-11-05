import { body, param, query } from 'express-validator';
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
  body('frequency')
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frequency must be daily, weekly or monthly'),
  body('startDate')
    .matches(DAY_REGEX)
    .withMessage('Start date must be in YYYY-MM-DD format')
    .toDate(),
  body('endDate')
    .optional({ values: 'falsy' })
    .matches(DAY_REGEX)
    .withMessage('End date must be in YYYY-MM-DD format')
    .toDate(),
  body('note')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Note must be at most 200 characters'),
];

const update = [
  param('id').isMongoId().withMessage('Invalid recurring id'),
  body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be greater than 0').toFloat(),
  body('category').optional().isMongoId().withMessage('Invalid category'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frequency must be daily, weekly or monthly'),
  body('endDate')
    .optional({ values: 'falsy' })
    .matches(DAY_REGEX)
    .withMessage('End date must be in YYYY-MM-DD format')
    .toDate(),
  body('note')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Note must be at most 200 characters'),
  body('active').optional().isBoolean().toBoolean(),
];

const list = [
  query('active').optional().isIn(['true', 'false']).withMessage('Invalid active filter'),
];

const idParam = [param('id').isMongoId().withMessage('Invalid recurring id')];

export { create, update, list, idParam };
