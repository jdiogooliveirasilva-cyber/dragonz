import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

type AllowedRole = 'OWNER' | 'ADMIN' | 'USER' | 'BANNED';

const ROLE_HIERARCHY: Record<AllowedRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  USER: 2,
  BANNED: 1,
};

export function requireRole(...roles: AllowedRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Não autenticado.' });
      return;
    }
    const userRole = req.user.role as AllowedRole;
    const hasPermission = roles.some(role => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]);
    if (!hasPermission) {
      res.status(403).json({ success: false, message: 'Acesso negado. Permissão insuficiente.' });
      return;
    }
    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Não autenticado.' });
    return;
  }
  const role = req.user.role as AllowedRole;
  if (ROLE_HIERARCHY[role] < ROLE_HIERARCHY['ADMIN']) {
    res.status(403).json({ success: false, message: 'Acesso restrito a administradores.' });
    return;
  }
  next();
}

export function requireOwner(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Não autenticado.' });
    return;
  }
  if (req.user.role !== 'OWNER') {
    res.status(403).json({ success: false, message: 'Acesso restrito ao proprietário.' });
    return;
  }
  next();
}

export function isAdminOrOwner(role: string): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}
