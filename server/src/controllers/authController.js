import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { conflict, unauthorized } from '../utils/ApiError.js';

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw conflict('Email already registered');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role === 'admin' ? 'admin' : 'member',
  });

  const token = signToken({ sub: String(user._id), role: user.role });
  res.status(201).json({ token, user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw unauthorized('Invalid credentials');

  const ok = await user.comparePassword(password);
  if (!ok) throw unauthorized('Invalid credentials');

  const token = signToken({ sub: String(user._id), role: user.role });
  res.json({ token, user });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw unauthorized();
  res.json({ user });
});
