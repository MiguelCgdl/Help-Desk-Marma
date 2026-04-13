import express from 'express';
import { 
    getBillingConfig, 
    updateBillingConfig, 
    getPendingTickets, 
    createMonthlyCut, 
    finalizeInvoice, 
    getInvoices 
} from '../controllers/billingController';

const router = express.Router();

router.get('/config', getBillingConfig);
router.put('/config', updateBillingConfig);
router.get('/pending/:companyId', getPendingTickets);
router.post('/cut', createMonthlyCut);
router.post('/:id/stamp', finalizeInvoice);
router.get('/history', getInvoices);

export default router;
