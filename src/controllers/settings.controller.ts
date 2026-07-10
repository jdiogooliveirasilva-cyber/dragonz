import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as settingsService from '../services/settings.service';
import { emitMaintenanceToggle, emitSiteSettingsUpdate } from '../sockets/socket';

export async function getSettings(_req: AuthRequest, res: Response): Promise<void> {
  const settings = await settingsService.getSettings();
  res.json({ success: true, data: settings });
}

export async function updateSettings(req: AuthRequest, res: Response): Promise<void> {
  const files = (req as any).files as Record<string, Express.Multer.File[]> | undefined;
  const body = req.body;

  if (files?.logo?.[0]) body.logo = `/uploads/settings/${files.logo[0].filename}`;
  if (files?.favicon?.[0]) body.favicon = `/uploads/settings/${files.favicon[0].filename}`;

  const settings = await settingsService.updateSettings(body);
  // Broadcast settings change so all clients update theme/branding live
  emitSiteSettingsUpdate(settings);
  res.json({ success: true, data: settings });
}

export async function toggleMaintenance(_req: AuthRequest, res: Response): Promise<void> {
  const settings = await settingsService.toggleMaintenanceMode();
  emitMaintenanceToggle(settings.maintenanceMode);
  res.json({ success: true, data: { maintenanceMode: settings.maintenanceMode } });
}

export async function uploadBanner(req: AuthRequest, res: Response): Promise<void> {
  const file = (req as any).file;
  if (!file) { res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' }); return; }
  const url = `/uploads/banners/${file.filename}`;
  const settings = await settingsService.getSettings();
  const bannerImages = [...settings.bannerImages, url];
  const updated = await settingsService.updateSettings({ bannerImages });
  emitSiteSettingsUpdate(updated);
  res.json({ success: true, data: { url, bannerImages } });
}

export async function uploadSidebarImage(req: AuthRequest, res: Response): Promise<void> {
  const file = (req as any).file;
  if (!file) { res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' }); return; }
  const url = `/uploads/settings/${file.filename}`;
  const settings = await settingsService.getSettings();
  const sidebarImages = [...settings.sidebarImages, url];
  const updated = await settingsService.updateSettings({ sidebarImages });
  emitSiteSettingsUpdate(updated);
  res.json({ success: true, data: { url, sidebarImages } });
}

export async function removeBanner(req: AuthRequest, res: Response): Promise<void> {
  const { url } = req.body;
  const settings = await settingsService.getSettings();
  const bannerImages = settings.bannerImages.filter(b => b !== url);
  const updated = await settingsService.updateSettings({ bannerImages });
  emitSiteSettingsUpdate(updated);
  res.json({ success: true, data: { bannerImages } });
}

export async function removeSidebarImage(req: AuthRequest, res: Response): Promise<void> {
  const { url } = req.body;
  const settings = await settingsService.getSettings();
  const sidebarImages = settings.sidebarImages.filter(s => s !== url);
  const updated = await settingsService.updateSettings({ sidebarImages });
  emitSiteSettingsUpdate(updated);
  res.json({ success: true, data: { sidebarImages } });
}
