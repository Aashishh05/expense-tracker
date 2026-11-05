import { body, param } from 'express-validator';

const create = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 1, max: 30 })
    .withMessage('Category name must be 1-30 characters'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be income or expense'),
  body('icon').optional({ values: 'falsy' }).trim().isLength({ max: 10 }).withMessage('Icon is too long'),
  body('color')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^#[0-9a-fA-F]{6}$/)
    .withMessage('Color must be a hex value like #22c55e'),
];

const update = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 1, max: 30 })
    .withMessage('Category name must be 1-30 characters'),
  body('type').not().exists().withMessage('Category type cannot be changed'),
  body('icon').optional({ values: 'falsy' }).trim().isLength({ max: 10 }).withMessage('Icon is too long'),
  body('color')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^#[0-9a-fA-F]{6}$/)
    .withMessage('Color must be a hex value like #22c55e'),
];

const idParam = [param('id').isMongoId().withMessage('Invalid category id')];

export { create, update, idParam };
