const router = require('express').Router();

const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const {
  register: registerValidator,
  login: loginValidator,
  profile: profileValidator,
  password: passwordValidator,
} = require('../validators/authValidators');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const protect = require('../middleware/authMiddleware');

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, profileValidator, validate, updateProfile);
router.put('/password', protect, passwordValidator, validate, changePassword);

module.exports = router;
