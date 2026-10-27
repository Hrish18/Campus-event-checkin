import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../lib/api.js';
import { formatDate, formatTime } from '../lib/format.js';
import useEventLive from '../hooks/useEventLive.js';
import { Alert, Spinner } from '../components/ui.jsx';
import DashboardTab from '../components/DashboardTab.jsx';
import StudentsTab from '../components/StudentsTab.jsx';
import CheckinTab from '../components/CheckinTab.jsx';

const TABS = [
  { id: 'dashboard', label: 'Live dashboard' },
  { id: 'students', label: 'Students' },
  { id: 'checkin', label: 'Check-in' },
];

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [copied, setCopied] = useState(false);
  const live = useEventLive(eventId);

  useEffect(() => {
    api
      .get(`/api/events/${eventId}`)
      .then((res) => setEvent(res.data.event))
      .catch((err) => setError(getErrorMessage(err)));
  }, [eventId]);

  async function onDelete() {
    if (!window.confirm('Delete this event and all of its students? This cannot be undone.')) return;
    try {
      await api.delete(`/api/events/${eventId}`);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const studentLink = `${window.location.origin}/e/${eventId}`;
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(studentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', studentLink);
    }
  }

  if (error && !event) {
    return (
      <div>
        <Alert type="error">{error}</Alert>
        <Link to="/" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">← Back to events</Link>
      </div>
    );
  }
  if (!event) return <Spinner label="Loading event…" />;

  return (
    <div>
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-800">← Back to events</Link>

      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(event.date)} · {formatTime(event.time)} · {event.venue}
          </p>
          {event.description && <p className="mt-2 max-w-2xl text-sm text-slate-600">{event.description}</p>}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={copyLink}>{copied ? 'Link copied ✓' : 'Copy student link'}</button>
          <button className="btn-secondary text-red-600" onClick={onDelete}>Delete</button>
        </div>
      </div>

      <Alert type="error" className="mb-4">{error || live.error}</Alert>

      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {live.loading ? (
        <Spinner label="Loading attendance…" />
      ) : (
        <>
          {tab === 'dashboard' && <DashboardTab live={live} />}
          {tab === 'students' && <StudentsTab eventId={eventId} live={live} />}
          {tab === 'checkin' && <CheckinTab eventId={eventId} live={live} />}
        </>
      )}
    </div>
  );
}
