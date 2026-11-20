import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import { CATEGORIES, PRIORITIES, STATUSES } from '../../constants';

const fmt = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function TicketQueue() {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '' });
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const load = useCallback(() => {
    const qs = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v)
    ).toString();
    api.get(`/admin/tickets${qs ? `?${qs}` : ''}`)
      .then((d) => setTickets(d.tickets))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  // Live: a new ticket or any update refreshes the queue.
  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => load();
    socket.on('ticket:new', refresh);
    socket.on('ticket:updated', refresh);
    return () => {
      socket.off('ticket:new', refresh);
      socket.off('ticket:updated', refresh);
    };
  }, [socket, load]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <h1>Ticket Queue</h1>

      {/* Filters */}
      <div className="card row wrap" style={{ gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label>Status</label>
          <select value={filters.status} onChange={set('status')}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label>Category</label>
          <select value={filters.category} onChange={set('category')}>
            <option value="">All</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label>Priority</label>
          <select value={filters.priority} onChange={set('priority')}>
            <option value="">All</option>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <button className="secondary" onClick={() => setFilters({ status: '', category: '', priority: '' })}>
          Clear
        </button>
      </div>

      <p className="muted">{tickets.length} ticket(s) · most urgent &amp; oldest first</p>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        tickets.map((t) => (
          <Link to={`/admin/tickets/${t._id}`} key={t._id} className="card" style={{ display: 'block', color: 'inherit' }}>
            <div className="row between wrap">
              <h2 style={{ margin: 0 }}>{t.subject}</h2>
              <div className="pill-row">
                <PriorityBadge value={t.priority} />
                <StatusBadge value={t.status} />
              </div>
            </div>
            <div className="row wrap" style={{ marginTop: 8, gap: 8 }}>
              <CategoryBadge value={t.category} />
              <span className="muted">{t.author?.name}</span>
              <span className="muted">· {t.book ? t.book.title : 'General / Account'}</span>
              <span className="muted">· {t.ticketId}</span>
              <span className="muted">· {fmt(t.createdAt)}</span>
              {t.assignedTo && <span className="badge blue">@ {t.assignedTo.name}</span>}
            </div>
          </Link>
        ))
      )}
    </>
  );
}
