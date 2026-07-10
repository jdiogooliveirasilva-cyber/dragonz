import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SiteSettings } from '../types';
import { settingsApi } from '../services/api';
import { useSocket } from './SocketContext';

interface ThemeContextType {
  settings: SiteSettings | null;
  isDark: boolean;
  toggleTheme: () => void;
  refreshSettings: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  settings: null,
  isDark: false,
  toggleTheme: () => {},
  refreshSettings: () => {},
});

const DEFAULT_SETTINGS: Partial<SiteSettings> = {
  siteName: 'PostHub',
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  fontFamily: 'Inter',
  theme: 'light',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const { socket } = useSocket();

  const applyTheme = useCallback((s: Partial<SiteSettings>, dark: boolean) => {
    const root = document.documentElement;
    const primary = s.primaryColor || '#6366f1';
    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--secondary-color', s.secondaryColor || '#8b5cf6');

    // Generate primary shades
    root.style.setProperty('--primary-500', primary);
    root.style.setProperty('--primary-600', primary);

    if (s.fontFamily) {
      root.style.setProperty('--font-family', `${s.fontFamily}, sans-serif`);
      document.body.style.fontFamily = `${s.fontFamily}, sans-serif`;
    }

    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (s.siteName) document.title = s.siteName;
    if (s.favicon) {
      const link = document.getElementById('favicon') as HTMLLinkElement;
      if (link) link.href = s.favicon;
    }

    if (s.backgroundImage) {
      document.body.style.backgroundImage = `url(${s.backgroundImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundAttachment = 'fixed';
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await settingsApi.get();
      setSettings(data.data);
      applyTheme(data.data, isDark || data.data.theme === 'dark');
    } catch {
      applyTheme(DEFAULT_SETTINGS, isDark);
    }
  }, [isDark, applyTheme]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('settings_update', (newSettings: SiteSettings) => {
        setSettings(newSettings);
        applyTheme(newSettings, isDark);
      });
      return () => { socket.off('settings_update'); };
    }
  }, [socket, isDark, applyTheme]);

  const toggleTheme = useCallback(() => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    applyTheme(settings || DEFAULT_SETTINGS, newDark);
  }, [isDark, settings, applyTheme]);

  return (
    <ThemeContext.Provider value={{ settings, isDark, toggleTheme, refreshSettings: fetchSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
