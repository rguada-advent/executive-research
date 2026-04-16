import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FUNCTION_OPTIONS, SENIORITY_OPTIONS } from '../../utils/constants';
import { agentCompanyDiscovery } from '../../services/agents/companyDiscovery';

const EMPTY_ROW = { company: '', titleFilter: '', func: '', seniority: 'svp' };
const MAX_ROWS = 3;

export default function DiscoveryInput({ onDiscovered }) {
  const { state, dispatch, toast } = useApp();
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  function updateRow(i, field, val) {
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
  }

  function addRow() {
    setRows(r => [...r, { ...EMPTY_ROW }]);
  }

  function removeRow(i) {
    setRows(r => r.filter((_, idx) => idx !== i));
  }

  async function handleDiscover() {
    const active = rows.filter(r => r.company.trim());
    if (!active.length) { toast('Please enter at least one company name.'); return; }
    if (!state.apiKey) { toast('Please configure your API key in settings.'); return; }
    setLoading(true);
    setStatus(`Searching ${active.length > 1 ? active.length + ' companies' : active[0].company}…`);
    try {
      const opts = { apiKey: state.apiKey, model: state.model };
      const results = await Promise.all(
        active.map(r =>
          agentCompanyDiscovery(r.company.trim(), r.func, r.seniority, r.titleFilter.trim(), opts)
            .then(leaders => leaders.map(l => ({
              name: l.name,
              title: l.title,
              seniority: l.seniority || 'other',
              source: l.source || 'Web Search',
              company: r.company.trim(),
            })))
        )
      );
      if (!results.some(r => r.length > 0)) {
        throw new Error('No executives found. Try broadening your search — leave Title blank, or use "All Functions" / "All Levels".');
      }
      const seen = new Set();
      const unique = results.flat().filter(l => {
        const key = l.name.toLowerCase();
        return seen.has(key) ? false : (seen.add(key), true);
      });
      dispatch({ type: 'ADD_LEADERS', payload: unique });
      const companies = active.map(r => r.company.trim()).join(', ');
      setStatus(`Found ${unique.length} executive${unique.length !== 1 ? 's' : ''}${active.length > 1 ? ` across ${active.length} searches` : ''}.`);
      toast(`Discovered ${unique.length} executives at ${companies}.`);
      if (onDiscovered) onDiscovered();
    } catch (err) {
      const msg = err.message || 'Unknown error';
      setStatus('Error: ' + msg);
      toast('Discovery failed: ' + msg);
      setLoading(false);
      return;
    }
    setLoading(false);
  }

  return (
    <div className="psg-card p-8 mb-4 psg-fade-up">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 bg-advent-blue rotate-45" aria-hidden />
          <span className="text-[11px] font-semibold tracking-[0.15em] text-advent-gray-500 uppercase">Talent Sourcing</span>
        </div>
        <h2 className="text-2xl font-bold text-advent-navy tracking-tight">Discover Executives</h2>
        <p className="text-sm text-advent-gray-500 mt-2 max-w-2xl leading-relaxed">
          Source candidates by company, function, and seniority. Run up to {MAX_ROWS} searches in parallel —
          results are deduplicated automatically.
        </p>
      </div>

      <div className="space-y-4 mb-4">
        {rows.map((row, i) => (
          <div key={i} className="relative rounded-xl border border-[var(--border-subtle)] bg-[var(--color-advent-gray-75)] p-4">
            {rows.length > 1 && (
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-advent-gray-500">
                  <span className="w-5 h-5 rounded-full bg-advent-navy text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                  Search
                </span>
                <button
                  onClick={() => removeRow(i)}
                  className="text-[11px] text-advent-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="psg-label">Company</label>
                <input
                  type="text"
                  value={row.company}
                  onChange={e => updateRow(i, 'company', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDiscover()}
                  placeholder="Pfizer"
                  className="psg-input"
                />
              </div>
              <div>
                <label className="psg-label">Title Keywords</label>
                <input
                  type="text"
                  value={row.titleFilter}
                  onChange={e => updateRow(i, 'titleFilter', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDiscover()}
                  placeholder="Commercial Operations"
                  className="psg-input"
                />
              </div>
              <div>
                <label className="psg-label">Function</label>
                <select
                  value={row.func}
                  onChange={e => updateRow(i, 'func', e.target.value)}
                  className="psg-input psg-select"
                >
                  {FUNCTION_OPTIONS.map(opt => (
                    <option key={opt} value={opt === 'All Functions' ? '' : opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="psg-label">Seniority</label>
                <select
                  value={row.seniority}
                  onChange={e => updateRow(i, 'seniority', e.target.value)}
                  className="psg-input psg-select"
                >
                  {SENIORITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rows.length < MAX_ROWS && (
        <button
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-advent-blue hover:text-advent-navy transition-colors mb-5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Add another search
        </button>
      )}

      <div className="flex items-center gap-3 pt-5 border-t border-[var(--border-subtle)]">
        <button
          onClick={handleDiscover}
          disabled={loading}
          className="psg-btn psg-btn-primary"
        >
          {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? 'Searching…' : 'Discover Talent'}
          {!loading && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          )}
        </button>
        {status && <span className="text-sm text-advent-gray-500">{status}</span>}
      </div>
    </div>
  );
}
