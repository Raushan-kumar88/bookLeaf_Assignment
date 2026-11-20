import { Router } from 'express';
import * as bookController from '../controllers/book.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';

const router = Router();

// Authors only — "My Books".
router.get('/', requireAuth, requireRole(ROLES.AUTHOR), bookController.getMyBooks);

export default router;
