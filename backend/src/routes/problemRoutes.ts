import { Router } from 'express';
import { getProblems, createProblem, updateProblem, deleteProblem } from '../controllers/problemController';
import { protectAdmin } from '../middleware/auth';

const router = Router();
// GET público: el formulario de tickets (sin login) necesita listar tipos de problema
router.route('/').get(getProblems).post(protectAdmin, createProblem);
router.route('/:id').put(protectAdmin, updateProblem).delete(protectAdmin, deleteProblem);
export default router;