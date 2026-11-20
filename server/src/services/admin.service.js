/**
 * Admin (ops-team) business logic: the ticket queue and everything an admin can
 * do to a ticket. Admins are NOT scoped to one author — they see everything.
 */
import { Ticket } from '../models/ticket.model.js';
import { Message } from '../models/message.model.js';
import { ApiError } from '../utils/ApiError.js';
import { MESSAGE_VISIBILITY, ROLES } from '../constants.js';
import { draftResponse } from './ai.service.js';
import { emitToAuthor, emitToAdmins, EVENTS } from '../sockets/index.js';

// Lower rank = more urgent (used to sort the queue).
const PRIORITY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };

/**
 * The full ticket queue with optional filters. Sorted most-urgent + oldest
 * first so the tickets that need attention bubble to the top.
 */
export async function getQueue({ status, category, priority, from, to } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const tickets = await Ticket.find(filter)
    .populate('author', 'name email authorId')
    .populate('book', 'title bookId status')
    .populate('assignedTo', 'name')
    .lean();

  tickets.sort((a, b) => {
    const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (byPriority !== 0) return byPriority;
    return new Date(a.createdAt) - new Date(b.createdAt); // oldest first
  });

  return tickets;
}

/** One ticket with its author/book context and ALL messages (incl. internal). */
export async function getTicketDetail(ticketId) {
  const ticket = await Ticket.findById(ticketId)
    .populate('author', 'name email authorId city phone')
    .populate('book')
    .populate('assignedTo', 'name email')
    .lean();
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const messages = await Message.find({ ticket: ticketId })
    .populate('sender', 'name role')
    .sort({ createdAt: 1 })
    .lean();

  return { ...ticket, messages };
}

/** Update status / override category or priority / assign to self. */
export async function updateTicket(ticketId, adminId, patch) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  if (patch.status) ticket.status = patch.status;

  // Overriding the AI records that a human changed its decision.
  if (patch.category && patch.category !== ticket.category) {
    ticket.category = patch.category;
    ticket.categoryOverridden = true;
  }
  if (patch.priority && patch.priority !== ticket.priority) {
    ticket.priority = patch.priority;
    ticket.priorityOverridden = true;
  }
  if (patch.assignToMe === true) ticket.assignedTo = adminId;

  await ticket.save();

  // Notify the author (status/priority/category may have changed) and admins.
  const payload = {
    ticketId: ticket._id,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
  };
  emitToAuthor(ticket.author, EVENTS.TICKET_UPDATED, payload);
  emitToAdmins(EVENTS.TICKET_UPDATED, payload);

  return ticket.toObject();
}

/** Add a PUBLIC reply (author-visible). Moves an Open ticket to In Progress. */
export async function addReply(ticketId, adminId, { text, isAiAssisted = false }) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const message = await Message.create({
    ticket: ticketId,
    sender: adminId,
    senderRole: ROLES.ADMIN,
    text,
    visibility: MESSAGE_VISIBILITY.PUBLIC,
    isAiAssisted,
  });

  if (ticket.status === 'Open') {
    ticket.status = 'In Progress';
    await ticket.save();
  }

  // Push the reply to the author in real time (no page refresh needed).
  emitToAuthor(ticket.author, EVENTS.MESSAGE_NEW, {
    ticketId: ticket._id,
    message: message.toObject(),
  });
  emitToAuthor(ticket.author, EVENTS.TICKET_UPDATED, {
    ticketId: ticket._id,
    status: ticket.status,
  });

  return { message, ticketStatus: ticket.status };
}

/** Add an INTERNAL note (never shown to the author). */
export async function addInternalNote(ticketId, adminId, { text }) {
  const ticket = await Ticket.findById(ticketId).select('_id');
  if (!ticket) throw ApiError.notFound('Ticket not found');

  return Message.create({
    ticket: ticketId,
    sender: adminId,
    senderRole: ROLES.ADMIN,
    text,
    visibility: MESSAGE_VISIBILITY.INTERNAL,
  });
}

/** Compact, factual summary of a book for grounding the AI draft. */
function buildBookFacts(book) {
  if (!book) return null;
  const money = (n) => (n === null || n === undefined ? 'N/A' : `${n}`);
  const date = (d) => (d ? new Date(d).toISOString().slice(0, 10) : 'none yet');
  return [
    `Title: ${book.title}`,
    `Status: ${book.status}`,
    `MRP: ${money(book.mrp)}`,
    `Copies sold: ${book.totalCopiesSold}`,
    `Royalty earned: ${money(book.totalRoyaltyEarned)}`,
    `Royalty paid: ${money(book.royaltyPaid)}`,
    `Royalty pending: ${money(book.royaltyPending)}`,
    `Last payout date: ${date(book.lastRoyaltyPayoutDate)}`,
    `Available on: ${book.availableOn?.length ? book.availableOn.join(', ') : 'not listed yet'}`,
  ].join('; ');
}

/** Generate an AI draft reply for a ticket (admin-triggered). */
export async function generateDraft(ticketId) {
  const ticket = await Ticket.findById(ticketId)
    .populate('author', 'name')
    .populate('book')
    .lean();
  if (!ticket) throw ApiError.notFound('Ticket not found');

  return draftResponse({
    category: ticket.category,
    subject: ticket.subject,
    description: ticket.description,
    authorName: ticket.author?.name,
    bookFacts: buildBookFacts(ticket.book),
  });
}
