/**
 * Shared domain constants.
 *
 * Single source of truth for the enums used across models, the AI service,
 * and request validators. Importing from one place prevents the classic
 * "category string typo in three files" bug.
 */

export const ROLES = Object.freeze({
  AUTHOR: 'author',
  ADMIN: 'admin',
});

/** The six support categories the AI must classify tickets into. */
export const CATEGORIES = Object.freeze([
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
]);

/** Fallback category when the AI is unavailable and no keyword matches. */
export const DEFAULT_CATEGORY = 'General Inquiry';

export const PRIORITIES = Object.freeze(['Critical', 'High', 'Medium', 'Low']);
export const DEFAULT_PRIORITY = 'Medium';

export const TICKET_STATUSES = Object.freeze([
  'Open',
  'In Progress',
  'Resolved',
  'Closed',
]);

export const MESSAGE_VISIBILITY = Object.freeze({
  PUBLIC: 'public', // author-visible reply
  INTERNAL: 'internal', // admin-only note
});
