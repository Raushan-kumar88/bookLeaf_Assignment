import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { loginSchema } from '../validators/auth.validators.js';

const router = Router();

// Public
router.post('/login', validate(loginSchema), authController.login);

// Private
router.get('/me', requireAuth, authController.me);

export default router;
