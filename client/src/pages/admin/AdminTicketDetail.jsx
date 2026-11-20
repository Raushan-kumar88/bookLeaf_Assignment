import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge } from '../../components/Badges';
import { CATEGORIES, PRIORITIES, STATUSES } from '../../constants';

const fmt = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const money = (n) => (n === null || n === undefined ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);

export default function AdminTicketDetail() {
  const { id } = useParams();
  const socket = useSocket();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  const [reply, setReply] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    api.get(`/admin/tickets/${id}`).then((d) => setTicket(d.ticket)).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Keep in sync if another admin changes this ticket.
  useEffect(() => {
    if (!socket) return undefined;
    const refresh = (p) => { if (p.ticketId === id) load(); };
    socket.on('ticket:updated', refresh);
    return () => socket.off('ticket:updated', refresh);
  }, [socket, id, load]);

  const patch = async (body) => {
    try {
      await api.patch(`/admin/tickets/${id}`, body);
      load();
    } catch (e) { setError(e.message); }
  };

  const generateDraft = async () => {
    setAiBusy(true);
    setError('');
    try {
      const { draft, model } = await api.post(`/admin/tickets/${id}/ai-draft`);
      setReply(draft);
      setAiModel(model);
    } catch (e) { setError(e.message); }
    finally { setAiBusy(false); }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/admin/tickets/${id}/messages`, { text: reply, isAiAssisted: !!aiModel });
      setReply(''); setAiModel('');
      load();
    } catch (e) { setError(e.message); }
    finally { setSending(false); }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post(`/admin/tickets/${id}/notes`, { text: note });
      setNote('');
      load();
    } catch (e) { setError(e.message); }
  };

  if (error) return <p className="error">{error}</p>;
  if (!ticket) return <p className="muted">Loading…</p>;
  const b = ticket.book;

  return (
    <>
      <Link to="/admin/tickets" className="muted">← Back to Queue</Link>
      <div className="row between wrap" style={{ marginTop: 12 }}>
        <h1 style={{ margin: 0 }}>{ticket.subject}</h1>
        <StatusBadge value={ticket.status} />
      </div>
      <p className="muted">
        {ticket.ticketId} · {fmt(ticket.createdAt)} · by {ticket.author?.name} ({ticket.author?.email})
      </p>

      {/* Admin controls: status, AI overrides, assign */}
      <div className="card row wrap" style={{ gap: 14, alignItems: 'flex-end' }}>
        <div style={{ minWidth: 130 }}>
          <label>Status</label>
          <select value={ticket.status} onChange={(e) => patch({ status: e.target.value })}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 180 }}>
          <label>Category {ticket.categoryOverridden ? '(overridden)' : '(AI)'}</label>
          <select value={ticket.category} onChange={(e) => patch({ category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 130 }}>
          <label>Priority {ticket.priorityOverridden ? '(overridden)' : '(AI)'}</label>
          <select value={ticket.priority} onChange={(e) => patch({ priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <button className="secondary" onClick={() => patch({ assignToMe: true })}>
          {ticket.assignedTo ? `Assigned: ${ticket.assignedTo.name}` : 'Assign to me'}
        </button>
      </div>

      {/* Author query + book context */}
      <div className="row wrap" style={{ gap: 14, alignItems: 'stretch' }}>
        <div className="card" style={{ flex: 2, minWidth: 280 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Author's query</div>
          <div>{ticket.description}</div>
        </div>
        {b && (
          <div className="card" style={{ flex: 1, minWidth: 220 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Book context</div>
            <b>{b.title}</b>
            <table style={{ marginTop: 8 }}>
              <tbody>
                <tr><td className="muted">Status</td><td>{b.status}</td></tr>
                <tr><td className="muted">Sold</td><td>{b.totalCopiesSold}</td></tr>
                <tr><td className="muted">Earned</td><td>{money(b.totalRoyaltyEarned)}</td></tr>
                <tr><td className="muted">Pending</td><td><b>{money(b.royaltyPending)}</b></td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conversation (public + internal) */}
      <h2 style={{ marginTop: 20 }}>Conversation</h2>
      {ticket.messages?.length === 0 && <p className="muted">No replies yet.</p>}
      {ticket.messages?.map((m) => (
        <div
          className="card"
          key={m._id}
          style={m.visibility === 'internal' ? { borderColor: 'var(--amber)', background: 'rgba(229,164,59,.06)' } : {}}
        >
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
            {m.visibility === 'internal'
              ? '🔒 Internal note'
              : m.senderRole === 'admin' ? 'BookLeaf Team (sent to author)' : 'Author'}
            {' · '}{fmt(m.createdAt)}{m.isAiAssisted ? ' · AI-assisted' : ''}
          </div>
          {m.text}
        </div>
      ))}

      {/* Reply box with AI draft */}
      <h2 style={{ marginTop: 20 }}>Reply to author</h2>
      <div className="card">
        <div className="row between">
          <button className="secondary" onClick={generateDraft} disabled={aiBusy}>
            {aiBusy ? 'Generating…' : '✨ Generate AI draft'}
          </button>
          {aiModel && <span className="muted" style={{ fontSize: 12 }}>draft by: {aiModel}</span>}
        </div>
        <textarea
          style={{ marginTop: 12 }}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write a reply, or generate an AI draft and edit it before sending…"
        />
        <button style={{ marginTop: 10 }} onClick={sendReply} disabled={sending || !reply.trim()}>
          {sending ? 'Sending…' : 'Send reply to author'}
        </button>
      </div>

      {/* Internal note */}
      <h2 style={{ marginTop: 20 }}>Internal note <span className="muted" style={{ fontSize: 13 }}>(not visible to author)</span></h2>
      <div className="card">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a private note for the team…" style={{ minHeight: 70 }} />
        <button className="secondary" style={{ marginTop: 10 }} onClick={addNote} disabled={!note.trim()}>Add internal note</button>
      </div>
    </>
  );
}
