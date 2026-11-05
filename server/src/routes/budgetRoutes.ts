import { Router } from 'express';

import { list, create, update, remove } from '../controllers/budgetController';
import { create as createValidator, update as updateValidator, list as listValidator, idParam } from '../validators/budgetValidators';
import validate from '../middleware/validate';
import protect from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', listValidator, validate, list);
router.post('/', createValidator, validate, create);
router.put('/:id', updateValidator, validate, update);
router.delete('/:id', idParam, validate, remove);

export default router;
