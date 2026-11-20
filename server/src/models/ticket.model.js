/**
 * Support ticket raised by an author.
 *
 * `category` and `priority` are set by the AI on creation, but admins can
 * override them — the `*Overridden` flags record whether a human changed the
 * AI's decision (useful for auditing AI accuracy). The original author query
 * lives in `subject` + `description`; all replies/notes are Message documents.
 */
import mongoose from 'mongoose';
import {
  CATEGORIES,
  PRIORITIES,
  TICKET_STATUSES,
  DEFAULT_CATEGORY,
  DEFAULT_PRIORITY,
} from '../constants.js';

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true, index: true },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Null when the query is "General / Account Level".
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null },

    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    attachmentName: { type: String, default: null }, // UI-only per the brief

    // --- AI-assisted fields (admin-overridable) ---
    category: { type: String, enum: CATEGORIES, default: DEFAULT_CATEGORY },
    categoryOverridden: { type: Boolean, default: false },
    priority: { type: String, enum: PRIORITIES, default: DEFAULT_PRIORITY },
    priorityOverridden: { type: Boolean, default: false },

    // How classification happened, for transparency/debugging.
    ai: {
      model: { type: String, default: null }, // e.g. "gpt-4o-mini" or "fallback"
      error: { type: String, default: null }, // set when AI failed and we fell back
    },

    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: 'Open',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Queue queries filter/sort by these a lot.
ticketSchema.index({ status: 1, priority: 1, createdAt: 1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);
