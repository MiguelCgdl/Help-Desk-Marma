import { Router } from 'express';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../controllers/companyController';
import { protectAdmin } from '../middleware/auth';

const router = Router();
// GET público: el formulario de tickets (sin login) necesita listar empresas
router.route('/').get(getCompanies).post(protectAdmin, createCompany);
router.route('/:id').put(protectAdmin, updateCompany).delete(protectAdmin, deleteCompany);
export default router;