const SENIORITY_STYLES = {
  'c-suite': 'bg-advent-navy/10 text-advent-navy',
  'svp': 'bg-advent-cyan/20 text-advent-cyan',
  'vp': 'bg-risk-none/20 text-risk-none',
  'director': 'bg-risk-medium/20 text-risk-medium',
  'other': 'bg-advent-gray-200 text-advent-gray-500',
};

const RISK_STYLES = {
  'none': 'bg-risk-none/20 text-risk-none',
  'low': 'bg-risk-low/20 text-risk-low',
  'medium': 'bg-risk-medium/20 text-risk-medium',
  'high': 'bg-risk-high/20 text-risk-high',
  'critical': 'bg-risk-critical text-white',
};

export function SeniorityBadge({ seniority }) {
  const style = SENIORITY_STYLES[seniority] || SENIORITY_STYLES.other;
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${style}`}>{seniority}</span>;
}

export function RiskBadge({ risk }) {
  const style = RISK_STYLES[risk] || RISK_STYLES.none;
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${style}`}>{risk}</span>;
}

export function StatusDot({ status }) {
  const cls = status === 'complete' ? 'bg-risk-none' : status === 'active' ? 'bg-risk-medium animate-pulse' : 'bg-advent-gray-500';
  return <span className={`w-2 h-2 rounded-full inline-block ${cls}`} />;
}
