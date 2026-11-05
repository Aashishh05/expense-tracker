/** Handles unmatched routes. */
function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/** Centralized error handler — normalizes Mongoose / JWT / duplicate-key errors. */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors;

  // Duplicate key error (e.g. email already registered, duplicate category)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyValue || {});
    if (keys.includes('email')) {
      statusCode = 409;
      message = 'That email is already registered';
    } else if (keys.includes('name') && keys.includes('type')) {
      statusCode = 409;
      message = 'A category with this name and type already exists';
    } else if (keys.includes('month') && keys.includes('category')) {
      statusCode = 409;
      message = 'A budget for this category and month already exists';
    } else {
      statusCode = 409;
      message = 'Duplicate value';
    }
  }

  // Mongoose schema validation
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors || {}).map((e) => ({ field: e.path, msg: e.message }));
  }

  // Invalid ObjectId passed as :id
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please log in again';
  }

  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
}

module.exports = { notFound, errorHandler };
