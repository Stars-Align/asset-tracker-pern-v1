import express from 'express';
import { body } from 'express-validator';
import {
    getLocations,
    getLocation,
    createLocation,
    updateLocation,
    deleteLocation,
} from '../controllers/locationController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const createValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('parent_id').optional({ nullable: true }).custom((value) => {
        if (value === null || value === undefined) return true;
        // Check if it's a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
            throw new Error('Parent ID must be a valid UUID');
        }
        return true;
    }),
];

const updateValidation = [
    body('name').optional().isString(),
    body('parent_id').optional().isUUID().withMessage('Parent ID must be a valid UUID'),
];

router.get('/', authenticate, getLocations);
router.get('/:id', authenticate, getLocation);
router.post('/', authenticate, createValidation, validate, createLocation);
router.put('/:id', authenticate, updateValidation, validate, updateLocation);
router.delete('/:id', authenticate, deleteLocation);

export default router;
