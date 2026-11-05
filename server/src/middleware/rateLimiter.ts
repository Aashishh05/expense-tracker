import { rateLimit } from 'express-rate-limit';

const jsonMessage = (message: string) => ({ success: false, message });

/** Global limiter for the whole /api surface. */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('Too many requests, please slow down'),
});

/** Stricter limiter for login/register — counts failed attempts only. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('Too many attempts, please try again in 15 minutes'),
});

export { generalLimiter, authLimiter };
