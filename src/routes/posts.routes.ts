import { Router } from 'express';
import * as postsController from '../controllers/posts.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.get('/', optionalAuthenticate, postsController.getPosts);
router.get('/categories', postsController.getCategories);
router.get('/tags', postsController.getTags);
router.get('/:id', optionalAuthenticate, postsController.getPost);

router.post('/', authenticate, requireAdmin, postsController.createPost);
router.put('/:id', authenticate, requireAdmin, postsController.updatePost);
router.delete('/:id', authenticate, requireAdmin, postsController.deletePost);
router.patch('/:id/pin', authenticate, requireAdmin, postsController.togglePin);

router.post('/categories', authenticate, requireAdmin, postsController.createCategory);
router.put('/categories/:id', authenticate, requireAdmin, postsController.updateCategory);
router.delete('/categories/:id', authenticate, requireAdmin, postsController.deleteCategory);

export default router;
