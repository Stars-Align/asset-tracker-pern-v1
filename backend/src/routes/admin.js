import express from 'express';
import { getStats, getUsers, deleteUser, toggleSubscription } from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';

const router = express.Router();

// All routes require Authentication AND Admin privileges
router.use(authenticate, isAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/subscription', toggleSubscription);
router.delete('/users/:id', deleteUser);

export default router;
