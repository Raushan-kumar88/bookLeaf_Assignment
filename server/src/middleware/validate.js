import { ApiError } from '../utils/ApiError.js';

/**
 * Request validation middleware driven by a Zod schema.
 *
 * Usage:  router.post('/', validate(createTicketSchema), controller)
 *
 * On success the parsed (and type-coerced) data replaces req[source].
 * On failure it throws a 400 with per-field messages — never a generic 500.
 */
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    req[source] = result.data;
    next();
  };
