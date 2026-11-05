import { Router } from 'express';

import { register, login, getMe, updateProfile, changePassword } from '../controllers/authController';
import { register as registerValidator, login as loginValidator, profile as profileValidator, password as passwordValidator } from '../validators/authValidators';
import { authLimiter } from '../middleware/rateLimiter';
import validate from '../middleware/validate';
import protect from '../middleware/authMiddleware';

const router = Router();

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, profileValidator, validate, updateProfile);
router.put('/password', protect, passwordValidator, validate, changePassword);

export default router;
