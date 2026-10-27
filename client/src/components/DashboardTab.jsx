import { StatCard } from './ui.jsx';
import { formatDateTime } from '../lib/format.js';

export default function DashboardTab({ live }) {
  const { stats, checkedIn, connected } = live;
  const pct = stats.total ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-amber-500'}`} />
        {connected ? 'Live — updates appear instantly' : 'Reconnecting… numbers refresh when back online'}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registered" value={stats.total} tone="indigo" />
        <StatCard label="Checked in" value={stats.checkedIn} tone="green" />
        <StatCard label="Remaining" value={stats.remaining} tone="amber" />
      </div>

      <div className="card">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium">Attendance</span>
          <span className="text-slate-500">{pct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Checked-in students ({checkedIn.length})</h2>
        {checkedIn.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Nobody has checked in yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Roll number</th>
                  <th className="py-2 font-medium">Checked in at</th>
                </tr>
              </thead>
              <tbody>
                {checkedIn.map((s) => (
                  <tr key={s._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4 font-medium">{s.name}</td>
                    <td className="py-2 pr-4 text-slate-600">{s.rollNumber}</td>
                    <td className="py-2 text-slate-600">{formatDateTime(s.checkedInAt)}</td>
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
