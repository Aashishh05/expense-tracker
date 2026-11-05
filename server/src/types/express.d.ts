import type { UserDocument } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      /** Set by the `protect` middleware after JWT verification. */
      user: UserDocument;
    }
  }
}

export {};
