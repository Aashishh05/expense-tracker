import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { jwtSecret } from '../utils/generateToken';

interface DecodedToken {
  id: string;
  /** Issued-at, in whole seconds (set by jsonwebtoken). */
  iat?: number;
}

/** Verifies the JWT in the Authorization header and attaches req.user. */
const protect: RequestHandler = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const decoded = jwt.verify(header.split(' ')[1], jwtSecret()) as unknown as DecodedToken;
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'No longer authorized' });
    }

    // A password change or reset ends every session that predates it, so a
    // stolen token can't survive the user's response to a compromise.
    if (user.passwordChangedAt && typeof decoded.iat === 'number') {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) {
        return res
          .status(401)
          .json({ success: false, message: 'Session ended — please log in again' });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export default protect;
