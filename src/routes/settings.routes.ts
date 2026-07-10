import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { requireAdmin, requireOwner } from '../middlewares/role.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.get('/', optionalAuthenticate, settingsController.getSettings);
router.put('/', authenticate, requireOwner, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), settingsController.updateSettings);
router.post('/maintenance/toggle', authenticate, requireOwner, settingsController.toggleMaintenance);
router.post('/banners', authenticate, requireAdmin, upload.single('banner'), settingsController.uploadBanner);
router.delete('/banners', authenticate, requireAdmin, settingsController.removeBanner);
router.post('/sidebar-images', authenticate, requireAdmin, upload.single('banner'), settingsController.uploadSidebarImage);
router.delete('/sidebar-images', authenticate, requireAdmin, settingsController.removeSidebarImage);

export default router;
