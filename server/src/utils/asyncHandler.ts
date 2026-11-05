import type { RequestHandler } from 'express';

/**
 * Wraps an async route handler so rejected promises
 * are forwarded to the centralized error handler.
 */
const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
