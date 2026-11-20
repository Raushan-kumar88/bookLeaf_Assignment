/**
 * Wraps an async Express handler so any thrown error (or rejected promise)
 * is forwarded to the central error middleware via `next()`.
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 *
 * This removes the need for a try/catch in every controller.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
