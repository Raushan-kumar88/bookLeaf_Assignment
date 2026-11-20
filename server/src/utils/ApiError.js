/**
 * Operational error with an HTTP status code.
 *
 * Controllers/services throw `ApiError` for expected failures (not found,
 * forbidden, validation, etc.). The central error handler turns these into
 * clean JSON responses instead of generic 500s.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode  HTTP status (e.g. 404)
   * @param {string} message     Human-readable message
   * @param {object} [details]   Optional extra info (e.g. field errors)
   */
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // distinguishes expected vs. unexpected errors
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', details) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'Forbidden') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Not found') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Conflict') {
    return new ApiError(409, msg);
  }
}
