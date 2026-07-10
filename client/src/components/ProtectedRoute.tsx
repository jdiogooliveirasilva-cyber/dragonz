import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  requiredRole?: 'ADMIN' | 'OWNER';
}

const ROLE_WEIGHT = { OWNER: 4, ADMIN: 3, USER: 2, BANNED: 1 };

export default function ProtectedRoute({ requiredRole }: Props) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const userWeight = ROLE_WEIGHT[user.role] ?? 0;
    const required = ROLE_WEIGHT[requiredRole] ?? 0;
    if (userWeight < required) return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
