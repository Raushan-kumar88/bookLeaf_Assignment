/**
 * Root API router. Every feature router is mounted here under a clear prefix,
 * so `index.js` only needs to mount this one router at `/api`.
 *
 * As phases land, new routers are added:
 *   /api/auth     (Phase 3)
 *   /api/books    (Phase 4)
 *   /api/tickets  (Phase 4)
 *   /api/admin    (Phase 6)
 */
import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import bookRoutes from './book.routes.js';
import ticketRoutes from './ticket.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes); // Phase 3
router.use('/books', bookRoutes); // Phase 4 (author)
router.use('/tickets', ticketRoutes); // Phase 4 (author)
router.use('/admin', adminRoutes); // Phase 6 (admin)

export default router;
