import prisma from '../config/database';
import { sanitizeText } from '../utils/sanitize.util';
import { clearMaintenanceCache } from '../middlewares/maintenance.middleware';

export async function getSettings() {
  let settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } });

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: 'singleton' },
    });
  }

  return settings;
}

export async function updateSettings(data: Partial<{
  siteName: string;
  description: string;
  logo: string;
  favicon: string;
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  footerText: string;
  socialLinks: Record<string, string>;
  bannerImages: string[];
  sidebarImages: string[];
  backgroundImage: string;
  welcomeMessage: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}>) {
  const updateData: any = {};

  if (data.siteName !== undefined) updateData.siteName = sanitizeText(data.siteName);
  if (data.description !== undefined) updateData.description = sanitizeText(data.description);
  if (data.logo !== undefined) updateData.logo = data.logo;
  if (data.favicon !== undefined) updateData.favicon = data.favicon;
  if (data.theme !== undefined) updateData.theme = data.theme;
  if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
  if (data.secondaryColor !== undefined) updateData.secondaryColor = data.secondaryColor;
  if (data.fontFamily !== undefined) updateData.fontFamily = sanitizeText(data.fontFamily);
  if (data.footerText !== undefined) updateData.footerText = sanitizeText(data.footerText);
  if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks;
  if (data.bannerImages !== undefined) updateData.bannerImages = data.bannerImages;
  if (data.sidebarImages !== undefined) updateData.sidebarImages = data.sidebarImages;
  if (data.backgroundImage !== undefined) updateData.backgroundImage = data.backgroundImage;
  if (data.welcomeMessage !== undefined) updateData.welcomeMessage = sanitizeText(data.welcomeMessage);
  if (data.maintenanceMode !== undefined) {
    updateData.maintenanceMode = data.maintenanceMode;
    clearMaintenanceCache();
  }
  if (data.maintenanceMessage !== undefined) {
    updateData.maintenanceMessage = sanitizeText(data.maintenanceMessage);
    clearMaintenanceCache();
  }

  return prisma.siteSettings.update({ where: { id: 'singleton' }, data: updateData });
}

export async function toggleMaintenanceMode() {
  const settings = await getSettings();
  clearMaintenanceCache();

  return prisma.siteSettings.update({
    where: { id: 'singleton' },
    data: { maintenanceMode: !settings.maintenanceMode },
  });
}
