/**
 * Ticket business logic for the AUTHOR side (create + read own tickets).
 * Admin-side operations live in admin.service.js (Phase 6).
 *
 * Every function is scoped by authorId so an author can never read or touch
 * another author's ticket.
 */
import crypto from 'crypto';
import { Ticket } from '../models/ticket.model.js';
import { Message } from '../models/message.model.js';
import { Book } from '../models/book.model.js';
import { ApiError } from '../utils/ApiError.js';
import { MESSAGE_VISIBILITY } from '../constants.js';
import { classifyAndScore } from './ai.service.js';
import { emitToAdmins, EVENTS } from '../sockets/index.js';

const newTicketId = () =>
  `TKT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

/**
 * Create a ticket for an author.
 * - Validates book ownership when a book is referenced.
 * - Runs AI classification + priority (fallback is always available).
 */
export async function createTicket(authorId, { subject, description, bookId, attachmentName }) {
  // If a book was chosen, it must belong to this author.
  let book = null;
  if (bookId) {
    book = await Book.findOne({ _id: bookId, author: authorId }).select('_id');
    if (!book) throw ApiError.badRequest('Selected book was not found for your account');
  }

  const { category, priority, model, error } = await classifyAndScore(subject, description);

  const ticket = await Ticket.create({
    ticketId: newTicketId(),
    author: authorId,
    book: book?._id ?? null,
    subject,
    description,
    attachmentName: attachmentName ?? null,
    category,
    priority,
    ai: { model, error },
  });

  // Live-notify the admin queue that a new ticket arrived.
  emitToAdmins(EVENTS.TICKET_NEW, { ticket: ticket.toObject() });

  return ticket;
}

/** All tickets raised by this author, newest first, with light book info. */
export function getTicketsByAuthor(authorId) {
  return Ticket.find({ author: authorId })
    .populate('book', 'title bookId')
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * One ticket (author-scoped) plus its PUBLIC messages only.
 * Internal admin notes are never returned to an author.
 */
export async function getTicketForAuthor(ticketId, authorId) {
  const ticket = await Ticket.findOne({ _id: ticketId, author: authorId })
    .populate('book', 'title bookId')
    .lean();
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const messages = await Message.find({
    ticket: ticket._id,
    visibility: MESSAGE_VISIBILITY.PUBLIC,
  })
    .sort({ createdAt: 1 })
    .lean();

  return { ...ticket, messages };
}
