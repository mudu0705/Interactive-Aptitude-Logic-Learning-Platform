import { Router } from 'express';
import {
  getPosts,
  getPostDetail,
  createPost,
  toggleLikePost,
  addComment,
} from '../controllers/forum.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/posts', getPosts);
router.get('/posts/:id', getPostDetail);
router.post('/posts', authenticate, createPost);
router.post('/posts/:id/like', authenticate, toggleLikePost);
router.post('/posts/:id/comments', authenticate, addComment);

export default router;
