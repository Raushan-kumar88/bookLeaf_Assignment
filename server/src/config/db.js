/**
 * MongoDB connection helper (Mongoose).
 *
 * Kept separate from the Express app so the seeder and the server can both
 * reuse the exact same connection logic.
 */
import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);

  // On networks whose DNS can't resolve Atlas SRV records, force public
  // resolvers (configured via DNS_SERVERS). No-op when the list is empty.
  if (env.dnsServers.length) {
    dns.setServers(env.dnsServers);
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.log(`[db] connected: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('[db] connection error:', err.message);
    throw err;
  }

  mongoose.connection.on('disconnected', () =>
    console.warn('[db] disconnected')
  );
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
