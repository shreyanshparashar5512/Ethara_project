import { Router } from 'express';
import { signup, login, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema } from '../validators/authValidators.js';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.get('/me', requireAuth, me);

export default router;
