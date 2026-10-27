import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../lib/api.js';
import { Alert } from '../components/ui.jsx';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', venue: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/api/events', form);
      navigate(`/events/${data.event._id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-800">← Back to events</Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">Create event</h1>
      <form onSubmit={onSubmit} className="card space-y-4">
        <Alert type="error">{error}</Alert>
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" required maxLength={150} className="input" value={form.title} onChange={set('title')} placeholder="e.g. AI Workshop" />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" rows={3} maxLength={2000} className="input" value={form.description} onChange={set('description')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="date">Date</label>
            <input id="date" type="date" required className="input" value={form.date} onChange={set('date')} />
          </div>
          <div>
            <label className="label" htmlFor="time">Time</label>
            <input id="time" type="time" required className="input" value={form.time} onChange={set('time')} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="venue">Venue</label>
          <input id="venue" required maxLength={200} className="input" value={form.venue} onChange={set('venue')} placeholder="e.g. Seminar Hall B" />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create event'}</button>
      </form>
    </div>
  );
}
