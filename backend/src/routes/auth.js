import express from 'express';
import { body } from 'express-validator';
import passport from 'passport';
import { register, login, getMe, upgradePro, unlinkProvider, oauthCallback, uploadAvatar, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Validation schemas
const registerValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').optional().isString(),
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', authenticate, getMe);
router.post('/upgrade', authenticate, upgradePro);
router.post('/unlink/:provider', authenticate, unlinkProvider);
router.post('/avatar', authenticate, uploadAvatar); // Avatar upload route
router.put('/profile', authenticate, updateProfile);

// Google OAuth
router.get('/google', (req, res, next) => {
    const { token } = req.query;
    // We can pass token in state if we want to ensure it's the same user linking
    passport.authenticate('google', { scope: ['profile', 'email'], state: token })(req, res, next);
});

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    oauthCallback
);

// Microsoft OAuth
router.get('/microsoft', (req, res, next) => {
    const { token } = req.query;
    passport.authenticate('microsoft', { state: token })(req, res, next);
});

router.get('/microsoft/callback',
    passport.authenticate('microsoft', { failureRedirect: '/login' }),
    oauthCallback
);

// Google OAuth Login (no authentication required)
router.get('/google/login',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Microsoft OAuth Login (no authentication required)
router.get('/microsoft/login',
    passport.authenticate('microsoft')
);

export default router;
