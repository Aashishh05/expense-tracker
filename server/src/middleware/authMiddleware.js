const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Verifies the JWT in the Authorization header and attaches req.user. */
module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'No longer authorized' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
