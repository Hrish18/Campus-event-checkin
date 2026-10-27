import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../lib/api.js';
import { formatDate, formatTime } from '../lib/format.js';
import { Alert, Spinner } from '../components/ui.jsx';

export default function EventLookup() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get(`/api/public/events/${eventId}`).then(({ data }) => setEvent(data.event)).catch(err => setLoadError(getErrorMessage(err))); }, [eventId]);
  async function onSubmit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const { data } = await api.post(`/api/public/events/${eventId}/student-login`, { studentId, password });
      sessionStorage.setItem(`student_token_${eventId}`, data.token);
      navigate(`/pass/${eventId}`);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  }
  if (loadError) return <div className="mx-auto max-w-sm"><Alert type="error">{loadError}</Alert></div>;
  if (!event) return <Spinner label="Loading event…" />;
  return <div className="mx-auto max-w-sm space-y-4">
    <div className="card"><h1 className="text-xl font-bold">{event.title}</h1><p className="text-sm text-slate-500">{formatDate(event.date)} · {formatTime(event.time)} · {event.venue}</p></div>
    <form className="card space-y-4" onSubmit={onSubmit}>
      <h2 className="font-semibold">Student login</h2><Alert type="error">{error}</Alert>
      <div><label className="label" htmlFor="student-id">Student ID / Roll number</label><input id="student-id" className="input" required value={studentId} onChange={e => setStudentId(e.target.value)} /></div>
      <div><label className="label" htmlFor="student-password">Password</label><input id="student-password" type="password" className="input" required value={password} onChange={e => setPassword(e.target.value)} /></div>
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Login & view QR'}</button>
      <p className="text-xs text-slate-500">Only students registered for this event can log in.</p>
    </form>
  </div>;
}
