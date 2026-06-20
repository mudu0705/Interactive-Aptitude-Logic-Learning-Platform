import { Router } from 'express';
import {
  getCategories,
  getTopicsByCategory,
  getTopicBySlug,
  getPersonalizedRoadmap,
} from '../controllers/topic.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/categories', getCategories);
router.get('/categories/:categorySlug/topics', getTopicsByCategory);
router.get('/topics/:slug', getTopicBySlug);
router.get('/roadmap', authenticate, getPersonalizedRoadmap);

export default router;
