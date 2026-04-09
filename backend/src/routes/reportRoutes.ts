import { Router } from 'express';
import { getMonthlySummary } from '../controllers/reportController';
import { protectAdmin } from '../middleware/auth';

const router = Router();
router.get('/summary', protectAdmin, getMonthlySummary);
export default router;