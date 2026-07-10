import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as usersService from '../services/users.service';
import { emitLikeUpdate } from '../sockets/socket';

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.params.id || req.user!.id;
  const user = await usersService.getUserProfile(userId);
  res.json({ success: true, data: user });
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const { name, bio } = req.body;
  const avatarFile = (req as any).file;

  const updateData: { name?: string; bio?: string; avatar?: string } = {};
  if (name) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  if (avatarFile) {
    updateData.avatar = `/uploads/avatars/${avatarFile.filename}`;
  }

  const user = await usersService.updateProfile(req.user!.id, updateData);
  res.json({ success: true, data: user });
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, message: 'Senha atual e nova senha são obrigatórias.' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ success: false, message: 'Nova senha deve ter no mínimo 6 caracteres.' });
    return;
  }
  const result = await usersService.changePassword(req.user!.id, currentPassword, newPassword);
  res.json({ success: true, data: result });
}

export async function togglePostLike(req: AuthRequest, res: Response): Promise<void> {
  const result = await usersService.togglePostLike(req.params.postId, req.user!.id);
  // Emit real-time like count update to all clients watching the post
  emitLikeUpdate(req.params.postId, (result as any).likesCount ?? 0);
  res.json({ success: true, data: result });
}

export async function getUsers(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit, search, role } = req.query;
  const result = await usersService.getUsers(
    page ? parseInt(page as string) : 1,
    limit ? Math.min(parseInt(limit as string), 50) : 20,
    search as string,
    role as string
  );
  res.json({ success: true, data: result });
}
