import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

export default function SubmitQuery() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState(''); // '' = General / Account Level
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/books').then((d) => setBooks(d.books)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { ticket } = await api.post('/tickets', {
        subject,
        description,
        bookId: bookId || null,
        attachmentName: attachmentName || null,
      });
      navigate(`/tickets/${ticket._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1>Submit a Support Query</h1>
      <form className="card" onSubmit={submit} style={{ maxWidth: 640 }}>
        <label>Which book is this about?</label>
        <select value={bookId} onChange={(e) => setBookId(e.target.value)}>
          <option value="">General / Account Level</option>
          {books.map((b) => (
            <option key={b._id} value={b._id}>{b.title}</option>
          ))}
        </select>

        <label>Subject</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary of your issue" />

        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your issue in detail…" />

        <label>Attachment (optional — name only)</label>
        <input value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} placeholder="e.g. defective-copy.jpg" />

        {error && <div className="error">{error}</div>}

        <button style={{ marginTop: 16 }} disabled={busy}>
          {busy ? 'Submitting…' : 'Submit Ticket'}
        </button>
      </form>
    </>
  );
}
