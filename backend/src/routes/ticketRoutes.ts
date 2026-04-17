import { Router } from 'express';
import { createTicket, getTickets, solveTicket, getCompanyTickets, toggleInvoice, bulkInvoice, deleteTicket, updateTicket, bulkDeleteTickets, bulkArchiveTickets } from '../controllers/ticketController';
import { upload } from '../middleware/upload';
import { protectAdmin, protectCompany, optionalCompanyAuth } from '../middleware/auth';

const router = Router();
router.get('/company/my', protectCompany, getCompanyTickets);
router.post('/', upload.single('image'), optionalCompanyAuth, createTicket);
router.get('/', protectAdmin, getTickets);
router.patch('/bulk-invoice', protectAdmin, bulkInvoice);
router.patch('/bulk-archive', protectAdmin, bulkArchiveTickets);
router.delete('/bulk-delete', protectAdmin, bulkDeleteTickets);
router.patch('/:id/solve', protectAdmin, solveTicket);
router.patch('/:id/invoice', protectCompany, toggleInvoice);
router.patch('/:id', protectAdmin, upload.single('image'), updateTicket);
router.delete('/:id', protectAdmin, deleteTicket);
export default router;