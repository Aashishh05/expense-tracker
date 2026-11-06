import { Router } from 'express';

import {
  list,
  create,
  getOne,
  update,
  remove,
  exportCsv,
  uploadReceipt,
  downloadReceipt,
  removeReceipt,
} from '../controllers/transactionController';
import { create as createValidator, update as updateValidator, list as listValidator, idParam } from '../validators/transactionValidators';
import validate from '../middleware/validate';
import protect from '../middleware/authMiddleware';
import receiptUpload from '../middleware/receiptUpload';

const router = Router();

router.use(protect);

// /export must be registered before /:id ("export" would otherwise be parsed as an id).
router.get('/export', listValidator, validate, exportCsv);
router.get('/', listValidator, validate, list);
router.post('/', createValidator, validate, create);
router.get('/:id', idParam, validate, getOne);
router.put('/:id', [...idParam, ...updateValidator], validate, update);
router.delete('/:id', idParam, validate, remove);
router.get('/:id/receipt', idParam, validate, downloadReceipt);
router.post('/:id/receipt', idParam, validate, receiptUpload.single('receipt'), uploadReceipt);
router.delete('/:id/receipt', idParam, validate, removeReceipt);

export default router;
