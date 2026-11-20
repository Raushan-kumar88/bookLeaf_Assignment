/**
 * Auth business logic. Controllers stay thin; this does the real work.
 */
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../utils/jwt.js';

/**
 * Validate credentials and issue a JWT.
 * The same generic error is returned for "no such email" and "wrong password"
 * so we don't reveal which accounts exist.
 */
export async function login(email, password) {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ id: user._id.toString(), role: user.role });
  return { token, user: user.toJSON() }; // toJSON strips the password hash
}

/** Fetch the current user from a token's id (used by GET /auth/me). */
export async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  return user;
}
