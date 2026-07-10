import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin, requireOwner } from '../middlewares/role.middleware';

const router = Router();

router.get('/dashboard', authenticate, requireAdmin, adminController.getDashboard);
router.put('/users/:userId/role', authenticate, requireOwner, adminController.setUserRole);
router.post('/users/:userId/ban', authenticate, requireAdmin, adminController.banUser);
router.post('/users/:userId/unban', authenticate, requireAdmin, adminController.unbanUser);
router.delete('/users/:userId', authenticate, requireOwner, adminController.deleteUser);

export default router;
