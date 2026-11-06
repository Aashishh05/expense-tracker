import { Router } from 'express';

import {
  list,
  create,
  detail,
  stats,
  update,
  remove,
  addMember,
  listTransactions,
} from '../controllers/groupController';
import {
  create as createValidator,
  update as updateValidator,
  idParam,
  addMember as addMemberValidator,
  listTransactions as transactionsValidator,
} from '../validators/groupValidators';
import validate from '../middleware/validate';
import protect from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', list);
router.post('/', createValidator, validate, create);
router.get('/:id', idParam, validate, detail);
router.get('/:id/stats', idParam, validate, stats);
router.get('/:id/transactions', [...idParam, ...transactionsValidator], validate, listTransactions);
router.put('/:id', [...idParam, ...updateValidator], validate, update);
router.delete('/:id', idParam, validate, remove);
router.post('/:id/members', [...idParam, ...addMemberValidator], validate, addMember);

export default router;
