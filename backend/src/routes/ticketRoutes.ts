import { Router } from 'express';
import { createTicket, getTickets, solveTicket, getCompanyTickets } from '../controllers/ticketController';
import { upload } from '../middleware/upload';
import { protectAdmin, protectCompany, optionalCompanyAuth } from '../middleware/auth';

const router = Router();
router.get('/company/my', protectCompany, getCompanyTickets);
router.post('/', upload.single('image'), optionalCompanyAuth, createTicket);
router.get('/', protectAdmin, getTickets);
router.patch('/:id/solve', protectAdmin, solveTicket);
export default router;