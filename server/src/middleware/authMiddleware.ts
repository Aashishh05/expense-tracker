import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { jwtSecret } from '../utils/generateToken';

interface DecodedToken {
  id: string;
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
