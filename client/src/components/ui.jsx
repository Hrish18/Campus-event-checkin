const ALERT_STYLES = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
};

export function Alert({ type = 'info', children, className = '' }) {
  if (!children) return null;
  return (
    <div role="alert" className={`rounded-lg border px-4 py-3 text-sm ${ALERT_STYLES[type]} ${className}`}>
      {children}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-slate-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function StatusBadge({ status }) {
  const checked = status === 'checked-in';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        checked ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'
      }`}
    >
      {checked ? 'Checked in' : 'Registered'}
    </span>
  );
}

export function StatCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'text-slate-900',
    green: 'text-green-600',
    amber: 'text-amber-600',
    indigo: 'text-indigo-600',
  };
  return (
    <div className="card text-center">
      <div className={`text-4xl font-bold tabular-nums ${tones[tone]}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}
