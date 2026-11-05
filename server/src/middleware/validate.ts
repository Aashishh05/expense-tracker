import type { RequestHandler } from 'express';
import { validationResult, type FieldValidationError } from 'express-validator';

/** Runs after validator chains; returns a 400 with a field/errors array. */
const validate: RequestHandler = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: result.array({ onlyFirstError: true }).map((e) => ({
      // express-validator 7 exposes `path`; older versions used `param`.
      field: (e as FieldValidationError).path || (e as { param?: string }).param || '',
      msg: e.msg,
    })),
  });
};

export default validate;
