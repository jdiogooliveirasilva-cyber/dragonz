import { Outlet } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const { settings } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Sidebar side="left" />
          {settings?.sidebarImages?.[0] && (
            <div className="mt-4 rounded-xl overflow-hidden">
              <img src={settings.sidebarImages[0]} alt="Sidebar" className="w-full object-cover rounded-xl" />
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-72 flex-shrink-0">
          {settings?.sidebarImages?.[1] && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img src={settings.sidebarImages[1]} alt="Sidebar" className="w-full object-cover rounded-xl" />
            </div>
          )}
          {settings?.bannerImages?.[0] && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img src={settings.bannerImages[0]} alt="Banner" className="w-full object-cover rounded-xl" />
            </div>
          )}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Sobre</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{settings?.description || 'Sua plataforma de postagens'}</p>
            {settings?.socialLinks && Object.keys(settings.socialLinks).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(settings.socialLinks).map(([platform, url]) => url && (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline capitalize">
                    {platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {settings?.footerText || '© 2024 PostHub. Todos os direitos reservados.'}
      </footer>
    </div>
  );
}
