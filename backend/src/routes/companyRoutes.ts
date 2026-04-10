import { Router } from 'express';
import { getCompanies, createCompany, updateCompany, deleteCompany, getCompanyLogo } from '../controllers/companyController';
import { protectAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();
router.get('/logo', getCompanyLogo);
// GET público: el formulario de tickets (sin login) necesita listar empresas
router.route('/').get(getCompanies).post(protectAdmin, upload.single('logo'), createCompany);
router.route('/:id').put(protectAdmin, upload.single('logo'), updateCompany).delete(protectAdmin, deleteCompany);
export default router;