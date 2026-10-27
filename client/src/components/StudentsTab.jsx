import { useCallback, useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../lib/api.js';
import { Alert, Spinner, StatusBadge } from './ui.jsx';

export default function StudentsTab({ eventId, live }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({ name: '', rollNumber: '', email: '', password: '' });
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null); // { type, text, details }
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/events/${eventId}/students`, { params: { q, status } });
      setStudents(data.students);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [eventId, q, status]);

  // Reload when filters change, and whenever live attendance changes (version).
  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q, live.version]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onAdd(e) {
    e.preventDefault();
    setNotice(null);
    setAdding(true);
    try {
      const { data } = await api.post(`/api/events/${eventId}/students`, form);
      setForm({ name: '', rollNumber: '', email: '', password: '' });
      setNotice({ type: 'success', text: `${data.student.name} registered. Student can now log in.` });
      await Promise.all([load(), live.refresh()]);
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setAdding(false);
    }
  }

  async function onCsv(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setNotice(null);
    setUploading(true);
    try {
      const csv = await file.text();
      const { data } = await api.post(`/api/events/${eventId}/students/bulk`, { csv });
      setNotice({
        type: data.skipped.length ? 'warning' : 'success',
        text: `Added ${data.added} student(s)${data.skipped.length ? `, skipped ${data.skipped.length}` : ''}.`,
        details: data.skipped.slice(0, 10).map((s) => `Line ${s.line}: ${s.reason}`),
      });
      await Promise.all([load(), live.refresh()]);
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setUploading(false);
    }
  }

  async function onRemove(s) {
    if (!window.confirm(`Remove ${s.name} from this event?`)) return;
    try {
      await api.delete(`/api/events/${eventId}/students/${s._id}`);
      await Promise.all([load(), live.refresh()]);
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    }
  }

  async function copyPass(s) {
    const url = `${window.location.origin}/e/${eventId}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice({ type: 'success', text: `Student login link copied.` });
    } catch {
      window.prompt('Copy this student login link:', url);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={onAdd} className="card space-y-3">
          <h2 className="font-semibold">Add a student</h2>
          <input className="input" required placeholder="Full name" value={form.name} onChange={set('name')} />
          <input className="input" required placeholder="Roll number" value={form.rollNumber} onChange={set('rollNumber')} />
          <input className="input" type="email" placeholder="Email (optional)" value={form.email} onChange={set('email')} />
          <input className="input" type="password" required minLength={8} placeholder="Student password (8+ characters)" value={form.password} onChange={set('password')} />
          <button className="btn-primary w-full" disabled={adding}>{adding ? 'Adding…' : 'Register student'}</button>
        </form>

        <div className="card space-y-3">
          <h2 className="font-semibold">Bulk upload (CSV)</h2>
          <p className="text-sm text-slate-600">
            Columns: <code className="rounded bg-slate-100 px-1">name</code>,{' '}
            <code className="rounded bg-slate-100 px-1">rollNumber</code>, and{' '}
            <code className="rounded bg-slate-100 px-1">password</code>, and optionally{' '}
            <code className="rounded bg-slate-100 px-1">email</code>. Duplicate roll numbers are skipped.
          </p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onCsv} />
          <button className="btn-secondary w-full" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? 'Uploading…' : 'Choose CSV file'}
          </button>
        </div>
      </div>

      {notice && (
        <Alert type={notice.type}>
          {notice.text}
          {notice.details?.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs">
              {notice.details.map((d) => <li key={d}>{d}</li>)}
            </ul>
          )}
        </Alert>
      )}
      <Alert type="error">{error}</Alert>

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="mr-auto font-semibold">Registered students ({live.stats.total})</h2>
          <input className="input !w-56" placeholder="Search name, roll no, email" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input !w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="registered">Registered</option>
            <option value="checked-in">Checked in</option>
          </select>
        </div>

        {loading ? (
          <Spinner label="Loading students…" />
        ) : students.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {q || status ? 'No students match your filters.' : 'No students yet. Add some above.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Roll no.</th>
                  
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4 font-medium">
                      {s.name}
                      {s.email && <div className="text-xs font-normal text-slate-500">{s.email}</div>}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">{s.rollNumber}</td>
                    
                    <td className="py-2 pr-4"><StatusBadge status={s.status} /></td>
                    <td className="space-x-3 py-2 text-right whitespace-nowrap">
                      
                      <button className="text-indigo-600 hover:underline" onClick={() => copyPass(s)}>Copy login link</button>
                      {s.status === 'registered' && (
                        <button className="text-red-600 hover:underline" onClick={() => onRemove(s)}>Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
