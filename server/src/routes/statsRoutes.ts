import { Router } from 'express';

import { summary, byCategory, monthly } from '../controllers/statsController';
import { summary as summaryValidator, byCategory as byCategoryValidator, monthly as monthlyValidator } from '../validators/statsValidators';
import validate from '../middleware/validate';
import protect from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/summary', summaryValidator, validate, summary);
router.get('/by-category', byCategoryValidator, validate, byCategory);
router.get('/monthly', monthlyValidator, validate, monthly);

export default router;
