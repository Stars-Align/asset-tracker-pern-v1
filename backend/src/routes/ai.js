import express from 'express';
import { analyzeImage } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/analyze', authenticate, analyzeImage);

export default router;
