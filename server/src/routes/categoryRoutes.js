const router = require('express').Router();

const { list, create, update, remove } = require('../controllers/categoryController');
const {
  create: createValidator,
  update: updateValidator,
  idParam,
} = require('../validators/categoryValidators');
const validate = require('../middleware/validate');
const protect = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', list);
router.post('/', createValidator, validate, create);
router.put('/:id', [...idParam, ...updateValidator], validate, update);
router.delete('/:id', idParam, validate, remove);

module.exports = router;
