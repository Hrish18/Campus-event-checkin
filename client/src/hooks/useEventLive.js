import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../lib/api.js';
import { createSocket } from '../lib/socket.js';

/**
 * Live attendance for one event: counters + checked-in list, kept fresh via
 * Socket.IO. `version` increments on every change so other tabs can refetch.
 */
export default function useEventLive(eventId) {
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, remaining: 0 });
  const [checkedIn, setCheckedIn] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    const [s, c] = await Promise.all([
      api.get(`/api/events/${eventId}/stats`),
      api.get(`/api/events/${eventId}/students`, { params: { status: 'checked-in' } }),
    ]);
    setStats(s.data);
    setCheckedIn(c.data.students);
    setVersion((v) => v + 1);
  }, [eventId]);

  useEffect(() => {
    let active = true;
    refresh()
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));

    const socket = createSocket();
    socket.on('connect', () => {
      socket.emit('event:join', eventId, (res) => setConnected(Boolean(res?.ok)));
      refresh().catch(() => {}); // catch up on anything missed while offline
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('attendance:update', ({ student, stats: s }) => {
      setStats(s);
      setCheckedIn((prev) => [student, ...prev.filter((p) => p._id !== student._id)]);
      setVersion((v) => v + 1);
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [eventId, refresh]);

  return { stats, checkedIn, loading, error, connected, version, refresh };
}
