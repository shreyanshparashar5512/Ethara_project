import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listUsers } from '../controllers/userController.js';

const router = Router();

router.get('/', requireAuth, listUsers);

export default router;
