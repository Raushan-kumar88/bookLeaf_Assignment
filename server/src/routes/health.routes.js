import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 * Lightweight liveness check (used by deploy platforms and smoke tests).
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'bookleaf-server',
    time: new Date().toISOString(),
  });
});

export default router;
