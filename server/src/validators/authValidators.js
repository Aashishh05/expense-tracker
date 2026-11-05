const { body } = require('express-validator');

const register = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must be at most 100 characters')
    .customSanitizer((value) => String(value).toLowerCase()),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .isLength({ max: 72 })
    .withMessage('Password must be at most 72 characters'),
];

const login = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address')
    .customSanitizer((value) => String(value).toLowerCase()),
  body('password').notEmpty().withMessage('Password is required'),
];

const profile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
  body('currency')
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code')
    .customSanitizer((value) => String(value).toUpperCase()),
];

const password = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .isLength({ max: 72 })
    .withMessage('New password must be at most 72 characters'),
];

module.exports = { register, login, profile, password };
