import { Router } from 'express';

import { list, create, update, remove } from '../controllers/categoryController';
import { create as createValidator, update as updateValidator, idParam } from '../validators/categoryValidators';
import validate from '../middleware/validate';
import protect from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', list);
router.post('/', createValidator, validate, create);
router.put('/:id', [...idParam, ...updateValidator], validate, update);
router.delete('/:id', idParam, validate, remove);

export default router;
