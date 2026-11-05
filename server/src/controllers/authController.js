const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, message: 'That email is already registered' });
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created',
    token,
    data: user,
  });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Logged in',
    token,
    data: user,
  });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

// PUT /api/auth/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.currency !== undefined) updates.currency = req.body.currency;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
    context: 'query',
  });

  res.json({ success: true, message: 'Profile updated', data: user });
});

// PUT /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  if (currentPassword === newPassword) {
    return res
      .status(400)
      .json({ success: false, message: 'New password must be different from the current one' });
  }

  user.password = newPassword;
  await user.save(); // pre-save hook hashes it

  res.json({ success: true, message: 'Password changed' });
});
