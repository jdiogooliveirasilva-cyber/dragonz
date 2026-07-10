import { Router } from 'express';
import authRoutes from './auth.routes';
import postsRoutes from './posts.routes';
import commentsRoutes from './comments.routes';
import usersRoutes from './users.routes';
import adminRoutes from './admin.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/posts', postsRoutes);
router.use('/posts/:postId/comments', commentsRoutes);
router.use('/users', usersRoutes);
router.use('/admin', adminRoutes);
router.use('/settings', settingsRoutes);
router.use('/posts/:postId/likes', (req, res, next) => {
  req.params.postId = req.params.postId;
  next();
});

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'PostHub API is running.', timestamp: new Date().toISOString() });
});

export default router;
