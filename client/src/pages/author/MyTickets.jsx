import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';

const fmt = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const load = useCallback(() => {
    api.get('/tickets').then((d) => setTickets(d.tickets)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live: refresh the list when a ticket is updated or gets a reply.
  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => load();
    socket.on('ticket:updated', refresh);
    socket.on('message:new', refresh);
    return () => {
      socket.off('ticket:updated', refresh);
      socket.off('message:new', refresh);
    };
  }, [socket, load]);

  if (loading) return <p className="muted">Loading your tickets…</p>;

  return (
    <>
      <h1>My Tickets</h1>
      {tickets.length === 0 && <p className="muted">No tickets yet. Raise one from “Submit Query”.</p>}

      {tickets.map((t) => (
        <Link to={`/tickets/${t._id}`} key={t._id} className="card" style={{ display: 'block', color: 'inherit' }}>
          <div className="row between wrap">
            <h2 style={{ margin: 0 }}>{t.subject}</h2>
            <div className="pill-row">
              <StatusBadge value={t.status} />
              <PriorityBadge value={t.priority} />
            </div>
          </div>
          <div className="row wrap" style={{ marginTop: 8, gap: 8 }}>
            <CategoryBadge value={t.category} />
            <span className="muted">{t.book ? t.book.title : 'General / Account'}</span>
            <span className="muted">· {t.ticketId}</span>
            <span className="muted">· {fmt(t.createdAt)}</span>
          </div>
        </Link>
      ))}
    </>
  );
}
