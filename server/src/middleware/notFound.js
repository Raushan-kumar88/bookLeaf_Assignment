import { ApiError } from '../utils/ApiError.js';

/**
 * Catches requests to unknown routes and forwards a 404 to the error handler,
 * so missing endpoints return clean JSON (not an HTML stack trace).
 */
export function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
