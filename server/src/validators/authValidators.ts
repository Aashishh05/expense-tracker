import { body } from 'express-validator';

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
    .customSanitizer((value: unknown) => String(value).toLowerCase()),
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
    .customSanitizer((value: unknown) => String(value).toLowerCase()),
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
    .customSanitizer((value: unknown) => String(value).toUpperCase()),
];

const password = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .isLength({ max: 72 })
    .withMessage('New password must be at most 72 characters'),
];

const forgotPassword = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address')
    .customSanitizer((value: unknown) => String(value).toLowerCase()),
];

const resetPassword = [
  body('token')
    .isHexadecimal()
    .withMessage('Invalid reset token')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .isLength({ max: 72 })
    .withMessage('Password must be at most 72 characters'),
];

export { register, login, profile, password, forgotPassword, resetPassword };
