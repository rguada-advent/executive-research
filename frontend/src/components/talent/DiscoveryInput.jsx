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
    if (!state.apiKey) { toast('Please configure your API key in the header.'); return; }
    setLoading(true);
    setStatus(`Searching ${active.length > 1 ? active.length + ' companies' : active[0].company}...`);
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
    <div className="bg-white rounded-xl border border-advent-blue/30 p-6 mb-4">
      <h2 className="text-base font-bold text-advent-navy flex items-center gap-2 mb-1">
        <span className="w-1 h-[18px] bg-advent-blue rounded" />
        Talent Discovery
      </h2>
      <p className="text-sm text-advent-gray-500 mb-4">
        Discover executives by company, function, and seniority level. Add up to {MAX_ROWS} searches to run in parallel.
      </p>

      <div className="space-y-3 mb-4">
        {rows.map((row, i) => (
          <div key={i} className="relative">
            {rows.length > 1 && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-advent-gray-500 uppercase tracking-wide">Search {i + 1}</span>
                <button
                  onClick={() => removeRow(i)}
                  className="text-xs text-advent-gray-400 hover:text-red-500 transition-colors"
                  title="Remove this search"
                >
                  × Remove
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">Company Name</label>
                <input
                  type="text"
                  value={row.company}
                  onChange={e => updateRow(i, 'company', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDiscover()}
                  placeholder="e.g. Pfizer, Johnson & Johnson"
                  className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">Title / Role Keywords</label>
                <input
                  type="text"
                  value={row.titleFilter}
                  onChange={e => updateRow(i, 'titleFilter', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDiscover()}
                  placeholder="e.g. Commercial Operations, R&D"
                  className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">Function / Department</label>
                <select
                  value={row.func}
                  onChange={e => updateRow(i, 'func', e.target.value)}
                  className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm bg-white"
                >
                  {FUNCTION_OPTIONS.map(opt => (
                    <option key={opt} value={opt === 'All Functions' ? '' : opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">Seniority Level</label>
                <select
                  value={row.seniority}
                  onChange={e => updateRow(i, 'seniority', e.target.value)}
                  className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm bg-white"
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
          className="text-sm text-advent-blue hover:underline mb-4 block"
        >
          + Add another company / role
        </button>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleDiscover}
          disabled={loading}
          className="bg-advent-blue text-white px-5 py-2 rounded text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          Discover Talent
        </button>
        {status && <span className="text-sm text-advent-gray-500">{status}</span>}
      </div>
    </div>
  );
}
