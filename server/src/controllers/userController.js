import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const filter = q
    ? {
        $or: [
          { name: new RegExp(String(q), 'i') },
          { email: new RegExp(String(q), 'i') },
        ],
      }
    : {};
  const users = await User.find(filter).sort({ name: 1 }).limit(200);
  res.json({ users });
});
