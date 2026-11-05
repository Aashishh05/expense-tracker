const router = require('express').Router();

const {
  list,
  create,
  getOne,
  update,
  remove,
} = require('../controllers/transactionController');
const {
  create: createValidator,
  update: updateValidator,
  list: listValidator,
  idParam,
} = require('../validators/transactionValidators');
const validate = require('../middleware/validate');
const protect = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', listValidator, validate, list);
router.post('/', createValidator, validate, create);
router.get('/:id', idParam, validate, getOne);
router.put('/:id', [...idParam, ...updateValidator], validate, update);
router.delete('/:id', idParam, validate, remove);

module.exports = router;
