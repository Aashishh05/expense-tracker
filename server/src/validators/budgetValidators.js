const { body, param, query } = require('express-validator');
const { MONTH_REGEX } = require('../utils/dates');

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

module.exports = { create, update, list, idParam };
