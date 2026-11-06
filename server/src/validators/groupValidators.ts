import { body, param, query } from 'express-validator';
import { DAY_REGEX } from '../utils/dates';

const create = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be 2-60 characters'),
];

const update = [
  param('id').isMongoId().withMessage('Invalid group id'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be 2-60 characters'),
];

const idParam = [param('id').isMongoId().withMessage('Invalid group id')];

const addMember = [
  param('id').isMongoId().withMessage('Invalid group id'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address')
    .customSanitizer((value: unknown) => String(value).toLowerCase()),
];

const listTransactions = [
  param('id').isMongoId().withMessage('Invalid group id'),
  query('type').optional().isIn(['income', 'expense']).withMessage('Invalid type filter'),
  query('startDate')
    .optional()
    .matches(DAY_REGEX)
    .withMessage('startDate must be in YYYY-MM-DD format'),
  query('endDate')
    .optional()
    .matches(DAY_REGEX)
    .withMessage('endDate must be in YYYY-MM-DD format'),
  query('sort')
    .optional()
    .isIn(['date', '-date', 'amount', '-amount'])
    .withMessage('Invalid sort field'),
  query('page').optional().isInt({ min: 1 }).withMessage('Invalid page').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit').toInt(),
];

export { create, update, idParam, addMember, listTransactions };
