const { validationResult } = require('express-validator');

/** Runs after validator chains; returns a 400 with a field/errors array. */
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.array({ onlyFirstError: true }).map((e) => ({
        field: e.path || e.param,
        msg: e.msg,
      })),
    });
  }
  next();
};
