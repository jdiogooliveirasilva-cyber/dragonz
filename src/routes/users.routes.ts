import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.get('/', authenticate, usersController.getUsers);
router.get('/me', authenticate, (req, res) => usersController.getProfile(req as any, res));
router.get('/:id', optionalAuthenticate, usersController.getProfile);
router.put('/me', authenticate, upload.single('avatar'), usersController.updateProfile);
router.put('/me/password', authenticate, usersController.changePassword);
router.post('/:postId/like', authenticate, usersController.togglePostLike);

export default router;
