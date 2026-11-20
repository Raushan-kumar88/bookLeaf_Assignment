/**
 * Socket.IO wiring for near-real-time ticket updates.
 *
 * Rooms:
 *   author:<userId>  — one room per author; they get updates to their tickets.
 *   admin            — all admins; they get new-ticket + status notifications.
 *
 * Connections are authenticated with the same JWT as the REST API (sent in the
 * socket handshake `auth.token`). Services call the small `emit*` helpers below
 * — they no-op safely if sockets aren't initialised (e.g. during seeding).
 */
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { verifyToken } from '../utils/jwt.js';
import { ROLES } from '../constants.js';

/** Event names shared with the frontend. */
export const EVENTS = {
  TICKET_NEW: 'ticket:new', // -> admins
  TICKET_UPDATED: 'ticket:updated', // -> author + admins
  MESSAGE_NEW: 'message:new', // -> author
};

let io = null;

export function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  // Authenticate every socket using the JWT from the handshake.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verifyToken(token);
      socket.user = { id: decoded.id, role: decoded.role };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.user;
    if (role === ROLES.ADMIN) socket.join('admin');
    else socket.join(`author:${id}`);
  });

  console.log('[socket] initialised');
  return io;
}

/** Notify one author (their ticket changed / got a reply). */
export function emitToAuthor(authorId, event, payload) {
  if (!io || !authorId) return;
  io.to(`author:${authorId}`).emit(event, payload);
}

/** Notify all admins (new ticket / status change). */
export function emitToAdmins(event, payload) {
  if (!io) return;
  io.to('admin').emit(event, payload);
}
