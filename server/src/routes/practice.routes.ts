import { Router } from 'express';
import {
  startSession,
  getQuestionsForSession,
  submitResponse,
  getUserAnalytics,
} from '../controllers/practice.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/sessions', authenticate, startSession);
router.get('/sessions/:sessionId/questions', authenticate, getQuestionsForSession);
router.post('/sessions/:sessionId/submit', authenticate, submitResponse);
router.get('/analytics', authenticate, getUserAnalytics);

export default router;
