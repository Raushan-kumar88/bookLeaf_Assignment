/**
 * Centralised environment configuration.
 *
 * Every other module imports `env` from here instead of reading
 * `process.env` directly. This gives us one place to document, default,
 * and (lightly) validate configuration.
 */
import dotenv from 'dotenv';

dotenv.config();

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    // Fail fast on genuinely required config rather than crashing later.
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  mongoUri: required('MONGO_URI'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // AI is optional by design: when the key is absent the service degrades
  // gracefully to a rules-based fallback (see services/ai.service.js).
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  // Optional: point the OpenAI SDK at an OpenAI-compatible provider (e.g.
  // Gemini's OpenAI endpoint). Empty -> uses the default OpenAI API.
  openaiBaseUrl: process.env.OPENAI_BASE_URL || '',

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  seedDefaultPassword: process.env.SEED_DEFAULT_PASSWORD || 'Password123!',

  // Optional: force custom DNS resolvers. Needed on some networks where the
  // system DNS can't resolve MongoDB Atlas SRV records (querySrv ECONNREFUSED).
  // Leave empty in environments where SRV lookups already work (e.g. prod).
  dnsServers: process.env.DNS_SERVERS
    ? process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean)
    : [],
};

export const isProd = env.nodeEnv === 'production';
