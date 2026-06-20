import { Router } from 'express';
import authRoutes from './auth.routes';
import topicRoutes from './topic.routes';
import practiceRoutes from './practice.routes';
import aiRoutes from './ai.routes';
import forumRoutes from './forum.routes';
import adminRoutes from './admin.routes';
import weeklyExamRoutes from './weekly-exam.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/topics', topicRoutes);
router.use('/practice', practiceRoutes);
router.use('/ai', aiRoutes);
router.use('/forum', forumRoutes);
router.use('/weekly-exams', weeklyExamRoutes);
router.use('/', adminRoutes); // mounts /certificates/claim and /certificates/verify/:id

export default router;
