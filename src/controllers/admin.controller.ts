import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as adminService from '../services/admin.service';

export async function getDashboard(_req: AuthRequest, res: Response): Promise<void> {
  const stats = await adminService.getDashboardStats();
  res.json({ success: true, data: stats });
}

export async function setUserRole(req: AuthRequest, res: Response): Promise<void> {
  const { role } = req.body;
  if (!role || !['ADMIN', 'USER', 'BANNED'].includes(role)) {
    res.status(400).json({ success: false, message: 'Cargo inválido.' });
    return;
  }
  const user = await adminService.setUserRole(req.params.userId, role, req.user!.id);
  res.json({ success: true, data: user });
}

export async function banUser(req: AuthRequest, res: Response): Promise<void> {
  const user = await adminService.banUser(req.params.userId, req.user!.id);
  res.json({ success: true, data: user });
}

export async function unbanUser(req: AuthRequest, res: Response): Promise<void> {
  const user = await adminService.unbanUser(req.params.userId);
  res.json({ success: true, data: user });
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  const result = await adminService.deleteUser(req.params.userId, req.user!.id);
  res.json({ success: true, data: result });
}
