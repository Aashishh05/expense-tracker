import crypto from 'crypto';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import asyncHandler from '../utils/asyncHandler';
import { sendMail } from '../utils/mailer';

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** The client never stores the raw token — only its hash lands in the DB. */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, message: 'That email is already registered' });
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(String(user._id));

  res.status(201).json({
    success: true,
    message: 'Account created',
    token,
    data: user,
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = generateToken(String(user._id));

  res.json({
    success: true,
    message: 'Logged in',
    token,
    data: user,
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

// PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const updates: { name?: string; currency?: string } = {};
  if (req.body.name !== undefined) updates.name = req.body.name as string;
  if (req.body.currency !== undefined) updates.currency = req.body.currency as string;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
    context: 'query',
  });

  res.json({ success: true, message: 'Profile updated', data: user });
});

// PUT /api/auth/password
export const changePassword = asyncHandler(async (req, res) => {
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

  user.password = newPassword as string;
  await user.save(); // pre-save hook hashes it

  res.json({ success: true, message: 'Password changed' });
});

// POST /api/auth/forgot-password
// Always answers the same message — never reveals whether an email exists.
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body as { email: string };
  const generic = { success: true, message: 'If that email is registered, a reset link has been sent.' };

  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.json(generic);

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = hashToken(token);
  user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  const clientUrl = (process.env.CLIENT_URL ?? 'http://localhost:5173').replace(/\/$/, '');
  await sendMail({
    to: user.email,
    subject: 'Reset your Expense Tracker password',
    text:
      `Hi ${user.name},\n\n` +
      `Use the link below to choose a new password (valid for 15 minutes):\n` +
      `${clientUrl}/reset-password?token=${token}\n\n` +
      `If you didn't request this, you can safely ignore this email.`,
  });

  return res.json(generic);
});

// POST /api/auth/reset-password  { token, password }
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body as { token: string; password: string };

  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+password');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'This reset link is invalid or has expired — please request a new one.',
    });
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.json({ success: true, message: 'Password updated — you can now log in with your new password.' });
});
