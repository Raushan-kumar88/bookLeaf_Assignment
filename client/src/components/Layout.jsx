/** App shell: top nav (role-aware) + routed page content. */
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const authorLinks = [
  { to: '/books', label: 'My Books' },
  { to: '/submit', label: 'Submit Query' },
  { to: '/tickets', label: 'My Tickets' },
];
const adminLinks = [{ to: '/admin/tickets', label: 'Ticket Queue' }];

export default function Layout() {
  const { user, logout } = useAuth();
  const links = user?.role === 'admin' ? adminLinks : authorLinks;

  return (
    <>
      <nav className="nav">
        <span className="brand">📘 BookLeaf</span>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            {l.label}
          </NavLink>
        ))}
        <span className="spacer" />
        <span className="muted">
          {user?.name} · {user?.role}
        </span>
        <button className="secondary" onClick={logout}>Logout</button>
      </nav>
      <div className="container">
        <Outlet />
      </div>
    </>
  );
}
