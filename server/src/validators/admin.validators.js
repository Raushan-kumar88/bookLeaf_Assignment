import { z } from 'zod';
import { CATEGORIES, PRIORITIES, TICKET_STATUSES } from '../constants.js';

/** PATCH /admin/tickets/:id — any subset of these fields. */
export const updateTicketSchema = z
  .object({
    status: z.enum([...TICKET_STATUSES]).optional(),
    category: z.enum([...CATEGORIES]).optional(),
    priority: z.enum([...PRIORITIES]).optional(),
    assignToMe: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

/** POST /admin/tickets/:id/messages — public reply to the author. */
export const replySchema = z.object({
  text: z.string().trim().min(1, 'Reply cannot be empty').max(5000),
  isAiAssisted: z.boolean().optional(),
});

/** POST /admin/tickets/:id/notes — internal, admin-only note. */
export const noteSchema = z.object({
  text: z.string().trim().min(1, 'Note cannot be empty').max(5000),
});
