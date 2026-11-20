/**
 * Central error handler — the single place that converts any error into a
 * consistent JSON response. Mounted last in index.js.
 *
 * Response shape:
 *   { "error": { "message": string, "details"?: any } }
 */
import { ApiError } from '../utils/ApiError.js';
import { isProd } from '../config/env.js';

// eslint-disable-next-line no-unused-vars  (Express needs the 4-arg signature)
export function errorHandler(err, req, res, next) {
  // Known / expected errors carry their own status code.
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, ...(err.details && { details: err.details }) },
    });
  }

  // Mongoose bad ObjectId → 400 instead of a confusing 500.
  if (err.name === 'CastError') {
    return res.status(400).json({ error: { message: `Invalid ${err.path}` } });
  }

  // Mongoose duplicate key → 409.
  if (err.code === 11000) {
    return res
      .status(409)
      .json({ error: { message: 'Duplicate value', details: err.keyValue } });
  }

  // Anything else is unexpected — log it and return a safe 500.
  console.error('[error]', err);
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      ...(isProd ? {} : { details: err.message }),
    },
  });
}
