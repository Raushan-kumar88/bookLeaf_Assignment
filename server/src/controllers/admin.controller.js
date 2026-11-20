import { asyncHandler } from '../utils/asyncHandler.js';
import * as adminService from '../services/admin.service.js';

/** GET /api/admin/tickets — queue with filters (?status&category&priority&from&to). */
export const getQueue = asyncHandler(async (req, res) => {
  const tickets = await adminService.getQueue(req.query);
  res.json({ count: tickets.length, tickets });
});

/** GET /api/admin/tickets/:id — full detail incl. internal notes. */
export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await adminService.getTicketDetail(req.params.id);
  res.json({ ticket });
});

/** PATCH /api/admin/tickets/:id — status / overrides / assign. */
export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await adminService.updateTicket(req.params.id, req.user.id, req.body);
  res.json({ ticket });
});

/** POST /api/admin/tickets/:id/messages — public reply to the author. */
export const addReply = asyncHandler(async (req, res) => {
  const result = await adminService.addReply(req.params.id, req.user.id, req.body);
  res.status(201).json(result);
});

/** POST /api/admin/tickets/:id/notes — internal note. */
export const addNote = asyncHandler(async (req, res) => {
  const note = await adminService.addInternalNote(req.params.id, req.user.id, req.body);
  res.status(201).json({ note });
});

/** POST /api/admin/tickets/:id/ai-draft — generate an AI draft reply. */
export const generateDraft = asyncHandler(async (req, res) => {
  const result = await adminService.generateDraft(req.params.id);
  res.json(result); // { draft, model, error }
});
