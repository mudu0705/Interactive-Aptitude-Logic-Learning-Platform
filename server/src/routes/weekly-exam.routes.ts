import { Router } from 'express';
import {
  getAvailableExams,
  startExamAttempt,
  submitExamAttempt,
  getExamResultDetails,
} from '../controllers/weekly-exam.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getAvailableExams);
router.post('/:examId/start', authenticate, startExamAttempt);
router.post('/submit', authenticate, submitExamAttempt);
router.get('/attempts/:attemptId/result', authenticate, getExamResultDetails);

export default router;
