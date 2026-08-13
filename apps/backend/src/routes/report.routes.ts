import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { processReport } from '../controllers/report.controller.js';
import { reportProcessingRateLimiter, checkRole } from '../middleware/security.middleware.js';

const router = Router();

// Strict payload limits: 25 MB max per file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  }
});

// POST /api/reports/process - DevSecOps protected endpoint
router.post(
  '/process',
  reportProcessingRateLimiter, // Strict rate limit (10 req/min)
  authMiddleware,               // Token verification
  checkRole(['Jornalista']),    // RBAC validation
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
  ]),
  processReport
);

export default router;
