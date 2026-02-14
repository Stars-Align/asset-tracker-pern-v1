import express from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const updateValidation = [
    body('full_name').optional().isString(),
    body('avatar_url').optional().isURL().withMessage('Avatar URL must be valid'),
];

router.get('/:id', authenticate, getProfile);
router.put('/:id', authenticate, updateValidation, validate, updateProfile);

export default router;
