const SENIORITY_STYLES = {
  'c-suite':  'bg-advent-navy/10 text-advent-navy border-advent-navy/20',
  'svp':      'bg-sky-50 text-sky-700 border-sky-100',
  'vp':       'bg-emerald-50 text-emerald-700 border-emerald-100',
  'director': 'bg-amber-50 text-amber-700 border-amber-100',
  'other':    'bg-advent-gray-100 text-advent-gray-700 border-[var(--border-subtle)]',
};

const RISK_STYLES = {
  'none':     'bg-emerald-50 text-emerald-700 border-emerald-100',
  'low':      'bg-sky-50 text-sky-700 border-sky-100',
  'medium':   'bg-amber-50 text-amber-700 border-amber-100',
  'high':     'bg-red-50 text-red-700 border-red-100',
  'critical': 'bg-red-600 text-white border-red-700',
};

const DOT_STYLES = {
  complete: 'bg-emerald-500',
  active:   'bg-advent-blue psg-pulse',
  failed:   'bg-red-500',
  idle:     'bg-advent-gray-350',
};

export function SeniorityBadge({ seniority }) {
  const style = SENIORITY_STYLES[seniority] || SENIORITY_STYLES.other;
  return (
    <span className={`psg-chip border ${style}`}>
      {(seniority || 'other').replace(/-/g, ' ')}
    </span>
  );
}

export function RiskBadge({ risk }) {
  const style = RISK_STYLES[risk] || RISK_STYLES.none;
  return (
    <span className={`psg-chip border ${style}`}>
      {risk}
    </span>
  );
}

export function StatusDot({ status = 'idle', label }) {
  const cls = DOT_STYLES[status] || DOT_STYLES.idle;
  if (label) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-advent-gray-500">
        <span className={`w-2 h-2 rounded-full ${cls}`} />
        {label}
      </span>
    );
  }
  return <span className={`w-2 h-2 rounded-full inline-block ${cls}`} />;
}
