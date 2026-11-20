/**
 * Authentication & authorization middleware.
 *
 *   requireAuth          -> verifies the JWT and attaches req.user = { id, role }
 *   requireRole(...roles) -> allows only the listed roles (RBAC)
 *
 * Together these protect every private route: authors can only reach author
 * routes, admins only admin routes, and data is further scoped by req.user.id
 * inside the services.
 */
import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have access to this resource'));
    }
    next();
  };
