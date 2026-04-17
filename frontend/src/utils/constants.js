export const MODES = { TALENT: 'talent', FORENSIC: 'forensic' };

export const MODELS = [
  { value: 'claude-opus-4-6', label: 'Opus 4.6' },
  { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
];

export const FUNCTION_OPTIONS = [
  'All Functions', 'Finance / CFO', 'Operations / COO', 'Technology / CTO / CIO',
  'Marketing / CMO', 'Sales / CRO', 'Human Resources / CHRO', 'Legal / General Counsel',
  'Strategy / Corp Dev', 'Supply Chain / Manufacturing', 'R&D / Science',
  'Regulatory / Compliance', 'Commercial / Business Unit'
];

export const SENIORITY_OPTIONS = [
  { value: 'all', label: 'All Levels' },
  { value: 'c-suite', label: 'C-Suite' },
  { value: 'svp', label: 'SVP / EVP' },
  { value: 'vp', label: 'VP' },
  { value: 'director', label: 'Director' },
];

export const FORENSIC_PIPELINE_STAGES = [
  { id: 'professional', agent: 1, label: 'Professional', required: true },
  { id: 'contact', agent: 2, label: 'Contact', required: false },
  { id: 'social', agent: 3, label: 'Social', required: false },
  { id: 'glassdoor', agent: 13, label: 'Glassdoor', required: false },
  { id: 'linkedin', agent: 12, label: 'LinkedIn', required: false },
  { id: 'legal', agent: 10, label: 'Legal', required: false },
  { id: 'regulatory', agent: 11, label: 'Regulatory', required: false },
  { id: 'verification', agent: 4, label: 'Verify', required: false },
  { id: 'brief', agent: 5, label: 'Report', required: true },
];

export const TALENT_PIPELINE_STAGES = [
  { id: 'research',      agent: 1,  label: 'Research',   required: true },
  { id: 'contact',       agent: 2,  label: 'Contact',    required: false },
  { id: 'lookalikes',    agent: 14, label: 'Lookalikes', required: false },
  { id: 'observations',  agent: 6,  label: 'Observe',    required: false },
  { id: 'questions',     agent: 8,  label: 'Guide',      required: false },
];

export const RISK_COLORS = {
  none: '#16a34a', low: '#06b6d4', medium: '#d97706',
  high: '#dc2626', critical: '#991b1b',
};

export const RISK_ORDER = ['none', 'low', 'medium', 'high', 'critical'];

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}
