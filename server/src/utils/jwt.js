/**
 * JWT helpers. One small module so token creation/verification is consistent
 * and the secret is read from config in exactly one place.
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** Sign a token for a user. Payload is kept minimal: id + role. */
export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

/** Verify a token and return its decoded payload (throws if invalid/expired). */
export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
