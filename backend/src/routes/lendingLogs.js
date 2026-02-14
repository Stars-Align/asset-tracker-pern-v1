import express from 'express';
import { getLendingLogs, getItemLendingLogs } from '../controllers/lendingLogController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getLendingLogs);
router.get('/items/:id/logs', authenticate, getItemLendingLogs);

export default router;
