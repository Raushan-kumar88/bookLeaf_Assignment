import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';

const fmt = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function TicketDetail() {
  const { id } = useParams();
  const socket = useSocket();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get(`/tickets/${id}`).then((d) => setTicket(d.ticket)).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Live: append admin replies + reflect status changes without refreshing.
  useEffect(() => {
    if (!socket) return undefined;
    const onMessage = (p) => {
      if (p.ticketId !== id) return;
      setTicket((t) => (t ? { ...t, messages: [...(t.messages || []), p.message] } : t));
    };
    const onUpdate = (p) => {
      if (p.ticketId !== id) return;
      setTicket((t) => (t ? { ...t, status: p.status ?? t.status, priority: p.priority ?? t.priority } : t));
    };
    socket.on('message:new', onMessage);
    socket.on('ticket:updated', onUpdate);
    return () => {
      socket.off('message:new', onMessage);
      socket.off('ticket:updated', onUpdate);
    };
  }, [socket, id]);

  if (error) return <p className="error">{error}</p>;
  if (!ticket) return <p className="muted">Loading…</p>;

  return (
    <>
      <Link to="/tickets" className="muted">← Back to My Tickets</Link>
      <div className="row between wrap" style={{ marginTop: 12 }}>
        <h1 style={{ margin: 0 }}>{ticket.subject}</h1>
        <div className="pill-row">
          <StatusBadge value={ticket.status} />
          <PriorityBadge value={ticket.priority} />
        </div>
      </div>
      <div className="row wrap" style={{ margin: '8px 0 16px', gap: 8 }}>
        <CategoryBadge value={ticket.category} />
        <span className="muted">{ticket.book ? ticket.book.title : 'General / Account'}</span>
        <span className="muted">· {ticket.ticketId} · {fmt(ticket.createdAt)}</span>
      </div>

      {/* Original query */}
      <div className="card">
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Your query</div>
        <div>{ticket.description}</div>
        {ticket.attachmentName && (
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>📎 {ticket.attachmentName}</div>
        )}
      </div>

      {/* Conversation (public replies only) */}
      <h2 style={{ marginTop: 20 }}>Responses</h2>
      {(!ticket.messages || ticket.messages.length === 0) && (
        <p className="muted">No responses yet. Our team will get back to you soon.</p>
      )}
      {ticket.messages?.map((m) => (
        <div className={`chat-msg ${m.senderRole}`} key={m._id}>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
            {m.senderRole === 'admin' ? 'BookLeaf Team' : 'You'} · {fmt(m.createdAt)}
          </div>
          {m.text}
        </div>
      ))}
    </>
  );
}
