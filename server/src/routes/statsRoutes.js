const router = require('express').Router();

const { summary, byCategory, monthly } = require('../controllers/statsController');
const {
  summary: summaryValidator,
  byCategory: byCategoryValidator,
  monthly: monthlyValidator,
} = require('../validators/statsValidators');
const validate = require('../middleware/validate');
const protect = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', summaryValidator, validate, summary);
router.get('/by-category', byCategoryValidator, validate, byCategory);
router.get('/monthly', monthlyValidator, validate, monthly);

module.exports = router;
