import express from 'express';
import { body } from 'express-validator';
import {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../controllers/categoryController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const createValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('icon').optional().isString(),
];

const updateValidation = [
    body('name').optional().isString(),
    body('icon').optional().isString(),
];

router.get('/', authenticate, getCategories);
router.get('/:id', authenticate, getCategory);
router.post('/', authenticate, createValidation, validate, createCategory);
router.put('/:id', authenticate, updateValidation, validate, updateCategory);
router.delete('/:id', authenticate, deleteCategory);

export default router;
