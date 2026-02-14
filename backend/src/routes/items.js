import express from 'express';
import { body } from 'express-validator';
import {
    getItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    lendItem,
    returnItem,
    batchUpdateCategory,
    batchClearCategory,
} from '../controllers/itemController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const createValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').optional().isString(),
    body('price').optional().isNumeric(),
    body('quantity').optional().isInt({ min: 0 }),
    body('serial_number').optional().isString(),
    body('warranty_expires').optional().isISO8601(),
    body('photo_url').optional().isString(),
    body('status').optional().isIn(['available', 'lent', 'lost', 'damaged']),
    body('category').optional().isString(),
    body('category_id').optional().isUUID(),
    body('location_id').optional().isUUID(),
    body('ai_tags').optional().isArray(),
    body('image_vector').optional().isArray(),
];

const lendValidation = [
    body('borrower').notEmpty().withMessage('Borrower name is required'),
    body('borrower_note').optional().isString(),
    body('due_date').optional().isISO8601(),
];

// Batch routes must come before :id routes
router.put('/batch/category', authenticate, batchUpdateCategory);
router.put('/batch/clear-category', authenticate, batchClearCategory);

router.get('/', authenticate, getItems);
router.get('/:id', authenticate, getItem);
router.post('/', authenticate, createValidation, validate, createItem);
router.put('/:id', authenticate, updateItem);
router.delete('/:id', authenticate, deleteItem);
router.post('/:id/lend', authenticate, lendValidation, validate, lendItem);
router.post('/:id/return', authenticate, returnItem);

export default router;
