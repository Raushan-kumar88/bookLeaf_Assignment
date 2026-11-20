import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import MyBooks from './pages/author/MyBooks';
import SubmitQuery from './pages/author/SubmitQuery';
import MyTickets from './pages/author/MyTickets';
import TicketDetail from './pages/author/TicketDetail';
import TicketQueue from './pages/admin/TicketQueue';
import AdminTicketDetail from './pages/admin/AdminTicketDetail';

/** Sends the user to the right home (or login). */
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center muted">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/tickets' : '/books'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Author app */}
      <Route element={<ProtectedRoute role="author"><Layout /></ProtectedRoute>}>
        <Route path="/books" element={<MyBooks />} />
        <Route path="/submit" element={<SubmitQuery />} />
        <Route path="/tickets" element={<MyTickets />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
      </Route>

      {/* Admin app */}
      <Route element={<ProtectedRoute role="admin"><Layout /></ProtectedRoute>}>
        <Route path="/admin/tickets" element={<TicketQueue />} />
        <Route path="/admin/tickets/:id" element={<AdminTicketDetail />} />
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
