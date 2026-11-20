import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  updateTicketSchema,
  replySchema,
  noteSchema,
} from '../validators/admin.validators.js';
import { ROLES } from '../constants.js';

const router = Router();

// Every admin route requires an authenticated admin.
router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get('/tickets', adminController.getQueue);
router.get('/tickets/:id', adminController.getTicket);
router.patch('/tickets/:id', validate(updateTicketSchema), adminController.updateTicket);
router.post('/tickets/:id/messages', validate(replySchema), adminController.addReply);
router.post('/tickets/:id/notes', validate(noteSchema), adminController.addNote);
router.post('/tickets/:id/ai-draft', adminController.generateDraft);

export default router;
