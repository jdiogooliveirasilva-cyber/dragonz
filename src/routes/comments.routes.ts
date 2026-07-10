import { Router } from 'express';
import * as commentsController from '../controllers/comments.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { commentLimiter } from '../middlewares/rateLimiter';

const router = Router({ mergeParams: true });

router.get('/', optionalAuthenticate, commentsController.getComments);
router.post('/', authenticate, commentLimiter, commentsController.createComment);
router.put('/:id', authenticate, commentsController.updateComment);
router.delete('/:id', authenticate, commentsController.deleteComment);
router.patch('/:id/pin', authenticate, requireAdmin, commentsController.togglePinComment);
router.post('/:id/like', authenticate, commentsController.toggleCommentLike);

export default router;
