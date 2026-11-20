import { Router } from 'express';
import * as ticketController from '../controllers/ticket.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTicketSchema } from '../validators/ticket.validators.js';
import { ROLES } from '../constants.js';

const router = Router();

// All author-facing ticket routes require an authenticated author.
router.use(requireAuth, requireRole(ROLES.AUTHOR));

router.post('/', validate(createTicketSchema), ticketController.createTicket);
router.get('/', ticketController.getMyTickets);
router.get('/:id', ticketController.getTicket);

export default router;
