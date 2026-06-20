import { Router } from 'express';
import {
  askTutor,
  checkATSResume,
  startMockInterview,
  respondMockInterview,
  endMockInterview,
} from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/tutor', askTutor);
router.post('/ats', authenticate, checkATSResume);
router.post('/interview/start', authenticate, startMockInterview);
router.post('/interview/respond', authenticate, respondMockInterview);
router.post('/interview/end', authenticate, endMockInterview);

export default router;
