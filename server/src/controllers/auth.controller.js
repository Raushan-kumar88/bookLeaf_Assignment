import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, user } = await authService.login(email, password);
  res.json({ token, user });
});

/** GET /api/auth/me  (requires auth) */
export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  res.json({ user });
});
