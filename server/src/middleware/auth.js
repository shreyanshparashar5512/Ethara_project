import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { unauthorized, forbidden } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw unauthorized('Missing or malformed Authorization header');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw unauthorized('Invalid or expired token');
  }

  const user = await User.findById(payload.sub).lean();
  if (!user) throw unauthorized('User no longer exists');

  req.user = { id: String(user._id), role: user.role, name: user.name, email: user.email };
  next();
});

export function requireGlobalRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!allowed.includes(req.user.role)) {
      return next(forbidden(`Requires global role: ${allowed.join(' or ')}`));
    }
    next();
  };
}
