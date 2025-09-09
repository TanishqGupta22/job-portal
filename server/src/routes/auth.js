const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { authGuard } = require('../middleware/auth');
const {
  register,
  login,
  refreshToken,
  logout,
  me,
} = require('../controllers/authController');

const router = Router();

const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 100 });

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', authLimiter, refreshToken);
router.post('/logout', authLimiter, logout);
router.get('/me', authGuard, me);

module.exports = router;


