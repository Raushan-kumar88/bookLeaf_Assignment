import { z } from 'zod';

/**
 * Create-ticket payload.
 * `bookId` is the Mongo _id of one of the author's books, or null/omitted for
 * a "General / Account Level" query.
 */
export const createTicketSchema = z.object({
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(200),
  description: z
    .string()
    .trim()
    .min(5, 'Please describe your issue (at least 5 characters)')
    .max(5000),
  bookId: z.string().trim().min(1).optional().nullable(),
  attachmentName: z.string().trim().max(255).optional().nullable(),
});
