import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../lib/api.js';
import { formatDate, formatTime } from '../lib/format.js';
import { Alert, Spinner } from '../components/ui.jsx';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/api/events')
      .then((res) => setEvents(res.data.events))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My events</h1>
        <Link to="/events/new" className="btn-primary">+ New event</Link>
      </div>

      <Alert type="error" className="mb-4">{error}</Alert>
      {loading && <Spinner label="Loading events…" />}

      {!loading && !error && events.length === 0 && (
        <div className="card py-12 text-center">
          <p className="text-slate-600">You haven't created any events yet.</p>
          <Link to="/events/new" className="btn-primary mt-4">Create your first event</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((ev) => (
          <Link key={ev._id} to={`/events/${ev._id}`} className="card transition hover:border-indigo-300 hover:shadow-md">
            <h2 className="text-lg font-semibold">{ev.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(ev.date)} · {formatTime(ev.time)}
            </p>
            <p className="text-sm text-slate-500">{ev.venue}</p>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <span><b>{ev.stats.total}</b> registered</span>
              <span className="text-green-700"><b>{ev.stats.checkedIn}</b> checked in</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
