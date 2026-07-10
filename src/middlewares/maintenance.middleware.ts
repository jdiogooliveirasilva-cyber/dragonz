import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../config/database';

let maintenanceModeCache: { enabled: boolean; message: string; cachedAt: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export async function maintenanceCheck(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  // API and static routes bypass for admins
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/uploads')) {
    next();
    return;
  }

  try {
    const now = Date.now();
    if (!maintenanceModeCache || now - maintenanceModeCache.cachedAt > CACHE_TTL) {
      const settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } });
      maintenanceModeCache = {
        enabled: settings?.maintenanceMode ?? false,
        message: settings?.maintenanceMessage ?? 'Site em manutenção. Voltamos em breve!',
        cachedAt: now,
      };
    }

    if (maintenanceModeCache.enabled) {
      // Allow admins and owner to pass through
      if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'OWNER')) {
        next();
        return;
      }
      // For API routes, return JSON
      if (req.path.startsWith('/api')) {
        res.status(503).json({
          success: false,
          maintenance: true,
          message: maintenanceModeCache.message,
        });
        return;
      }
      next();
      return;
    }

    next();
  } catch {
    next();
  }
}

export function clearMaintenanceCache(): void {
  maintenanceModeCache = null;
}
