import { Router } from 'express';

import { list, create, getOne, update, remove, exportCsv } from '../controllers/transactionController';
import { create as createValidator, update as updateValidator, list as listValidator, idParam } from '../validators/transactionValidators';
import validate from '../middleware/validate';
import protect from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

// /export must be registered before /:id ("export" would otherwise be parsed as an id).
router.get('/export', listValidator, validate, exportCsv);
router.get('/', listValidator, validate, list);
router.post('/', createValidator, validate, create);
router.get('/:id', idParam, validate, getOne);
router.put('/:id', [...idParam, ...updateValidator], validate, update);
router.delete('/:id', idParam, validate, remove);

export default router;
