import { Router } from 'express';
import { login, companyLogin } from '../controllers/authController';

const router = Router();
router.post('/login', login);
router.post('/company-login', companyLogin);
export default router;