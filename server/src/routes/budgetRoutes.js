const router = require('express').Router();

const { list, create, update, remove } = require('../controllers/budgetController');
const {
  create: createValidator,
  update: updateValidator,
  list: listValidator,
  idParam,
} = require('../validators/budgetValidators');
const validate = require('../middleware/validate');
const protect = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', listValidator, validate, list);
router.post('/', createValidator, validate, create);
router.put('/:id', updateValidator, validate, update);
router.delete('/:id', idParam, validate, remove);

module.exports = router;
