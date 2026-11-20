import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin/tickets' : '/books', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center">
      <form className="card" style={{ width: 360 }} onSubmit={submit}>
        <h1>📘 BookLeaf</h1>
        <p className="muted">Author Support &amp; Communication Portal</p>

        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoFocus />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

        {error && <div className="error">{error}</div>}

        <button style={{ width: '100%', marginTop: 16 }} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
          Test: <b>priya.sharma@email.com</b> (author) ·{' '}
          <b>admin@bookleaf.com</b> (admin) · password <b>Password123!</b>
        </p>
      </form>
    </div>
  );
}
