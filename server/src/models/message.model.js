/**
 * A message on a ticket thread.
 *
 * One model covers two cases, separated by `visibility`:
 *   - public   → admin reply the author can see
 *   - internal → admin-only note (RBAC hides these from authors)
 *
 * `isAiAssisted` marks replies that started from an AI draft.
 */
import mongoose from 'mongoose';
import { ROLES, MESSAGE_VISIBILITY } from '../constants.js';

const messageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: { type: String, enum: Object.values(ROLES), required: true },

    text: { type: String, required: true },

    visibility: {
      type: String,
      enum: Object.values(MESSAGE_VISIBILITY),
      default: MESSAGE_VISIBILITY.PUBLIC,
      index: true,
    },
    isAiAssisted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);
