import { Router } from 'express';
import { getProblems, createProblem, updateProblem, deleteProblem, importProblems } from '../controllers/problemController';
import { protectAdmin } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET público: el formulario de tickets (sin login) necesita listar tipos de problema
router.route('/').get(getProblems).post(protectAdmin, createProblem);
router.route('/import').post(protectAdmin, upload.single('file'), importProblems);
router.route('/:id').put(protectAdmin, updateProblem).delete(protectAdmin, deleteProblem);

export default router;