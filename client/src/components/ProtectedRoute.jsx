/**
 * Guards private routes. Redirects to /login when logged out, and to the user's
 * own home when their role isn't allowed on this route.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="center muted">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/tickets' : '/books'} replace />;
  }
  return children;
}
