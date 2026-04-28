import express from 'express';
import passport from 'passport';
import { authLimiter } from '../middleware/rateLimiter.js';
import { getMe, githubCallback, login, register, getUserStats, updateUserPreferences } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.get('/stats', protect, getUserStats);
router.post('/preferences', protect, updateUserPreferences);
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { session: false }), githubCallback);

export default router;
