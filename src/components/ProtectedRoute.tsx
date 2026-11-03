import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';
import type { UserRole } from '../services/api';

export default function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <main className="state-message" role="status">Checking your session…</main>;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (roles && (!user || !roles.includes(user.role))) return <Navigate to="/account" replace />;
  return <>{children}</>;
}
