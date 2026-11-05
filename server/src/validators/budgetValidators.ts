import { body, param, query } from 'express-validator';
import { MONTH_REGEX } from '../utils/dates';

const create = [
  body('category').isMongoId().withMessage('Invalid category'),
  body('month')
    .matches(MONTH_REGEX)
    .withMessage('Month must be in YYYY-MM format'),
  body('limit')
    .isFloat({ gt: 0 })
    .withMessage('Limit must be greater than 0')
    .toFloat(),
];

const update = [
  param('id').isMongoId().withMessage('Invalid budget id'),
  body('limit')
    .isFloat({ gt: 0 })
    .withMessage('Limit must be greater than 0')
    .toFloat(),
];

const list = [
  query('month')
    .optional()
    .matches(MONTH_REGEX)
    .withMessage('Month must be in YYYY-MM format'),
];

const idParam = [param('id').isMongoId().withMessage('Invalid budget id')];

export { create, update, list, idParam };
