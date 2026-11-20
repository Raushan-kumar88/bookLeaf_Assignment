import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const money = (n) => (n === null || n === undefined ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export default function MyBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/books')
      .then((d) => setBooks(d.books))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Loading your books…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <>
      <h1>My Books</h1>
      <p className="muted">{books.length} title(s)</p>

      <div className="grid">
        {books.map((b) => {
          const live = b.status === 'Published & Live';
          return (
            <div className="card" key={b._id}>
              <div className="row between">
                <h2 style={{ margin: 0 }}>{b.title}</h2>
                <span className={`badge ${live ? 'green' : 'amber'}`}>{live ? 'Live' : 'In Production'}</span>
              </div>
              <p className="muted" style={{ margin: '6px 0 12px' }}>
                {b.genre} · {b.isbn || 'ISBN pending'} · {fmtDate(b.publicationDate)}
              </p>

              {live ? (
                <table>
                  <tbody>
                    <tr><td className="muted">MRP</td><td>{money(b.mrp)}</td></tr>
                    <tr><td className="muted">Copies sold</td><td>{b.totalCopiesSold}</td></tr>
                    <tr><td className="muted">Royalty earned</td><td>{money(b.totalRoyaltyEarned)}</td></tr>
                    <tr><td className="muted">Royalty paid</td><td>{money(b.royaltyPaid)}</td></tr>
                    <tr><td className="muted">Royalty pending</td><td><b>{money(b.royaltyPending)}</b></td></tr>
                    <tr><td className="muted">Last payout</td><td>{fmtDate(b.lastRoyaltyPayoutDate)}</td></tr>
                  </tbody>
                </table>
              ) : (
                <p className="muted">This book is still in production. Sales &amp; royalty details will appear once it goes live.</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
