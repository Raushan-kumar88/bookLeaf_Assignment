import { asyncHandler } from '../utils/asyncHandler.js';
import * as ticketService from '../services/ticket.service.js';

/** POST /api/tickets  — raise a new support ticket (AI classifies it). */
export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.user.id, req.body);
  res.status(201).json({ ticket });
});

/** GET /api/tickets  — the author's own tickets. */
export const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await ticketService.getTicketsByAuthor(req.user.id);
  res.json({ count: tickets.length, tickets });
});

/** GET /api/tickets/:id  — one ticket + its public conversation. */
export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketForAuthor(req.params.id, req.user.id);
  res.json({ ticket });
});
