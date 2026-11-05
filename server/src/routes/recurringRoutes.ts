import { Router } from 'express';

import { list, create, update, remove } from '../controllers/recurringController';
import { create as createValidator, update as updateValidator, list as listValidator, idParam } from '../validators/recurringValidators';
import validate from '../middleware/validate';
import protect from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', listValidator, validate, list);
router.post('/', createValidator, validate, create);
router.put('/:id', [...idParam, ...updateValidator], validate, update);
router.delete('/:id', idParam, validate, remove);

export default router;
