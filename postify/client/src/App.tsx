import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import FeedPage from './pages/FeedPage';
import PostDetailPage from './pages/PostDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import SettingsPage from './pages/SettingsPage';
import SearchPage from './pages/SearchPage';
import MaintenancePage from './pages/MaintenancePage';

function AppContent() {
  const { user, loading } = useAuth();
  const { settings } = useTheme();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Maintenance mode for non-admin users
  if (settings?.maintenanceMode && (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER'))) {
    return <MaintenancePage message={settings.maintenanceMessage} />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/reset-password" element={<LoginPage resetMode />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<FeedPage />} />
        <Route path="post/:id" element={<PostDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="profile/:id" element={<ProfilePage />} />

        <Route path="admin" element={<ProtectedRoute requiredRole="ADMIN" />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppContent />;
}
