import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FUNCTION_OPTIONS, SENIORITY_OPTIONS } from '../../utils/constants';
import { agentCompanyDiscovery } from '../../services/agents/companyDiscovery';

export default function DiscoveryInput({ onDiscovered }) {
  const { state, dispatch, toast } = useApp();
  const [company, setCompany] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [func, setFunc] = useState('');
  const [seniority, setSeniority] = useState('svp');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleDiscover() {
    if (!company.trim()) { toast('Please enter a company name.'); return; }
    if (!state.apiKey) { toast('Please configure your API key in the header.'); return; }
    setLoading(true);
    setStatus('AI searching the web for executives...');
    try {
      const leaders = await agentCompanyDiscovery(company.trim(), func, seniority, titleFilter.trim(), {
        apiKey: state.apiKey,
        model: state.model,
      });
      if (!Array.isArray(leaders) || leaders.length === 0) {
        throw new Error('No executives found. Try broadening your search — leave Title blank, or use "All Functions" / "All Levels".');
      }
      const withSource = leaders.map(l => ({
        name: l.name,
        title: l.title,
        seniority: l.seniority || 'other',
        source: l.source || 'Web Search',
        company: company.trim(),
      }));
      dispatch({ type: 'ADD_LEADERS', payload: withSource });
      setStatus(`Found ${withSource.length} executive${withSource.length !== 1 ? 's' : ''}.`);
      toast(`Discovered ${withSource.length} executives at ${company}.`);
      if (onDiscovered) onDiscovered();
    } catch (err) {
      const msg = err.message || 'Unknown error';
      setStatus('Error: ' + msg);
      toast('Discovery failed: ' + msg);
      setLoading(false);
      return; // Don't clear status on error
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
        Discover executives by company, function, and seniority level.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">Company Name</label>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDiscover()}
            placeholder="e.g. Pfizer, Johnson & Johnson"
            className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">Title / Role Keywords</label>
          <input
            type="text"
            value={titleFilter}
            onChange={e => setTitleFilter(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDiscover()}
            placeholder="e.g. Commercial Operations, R&D"
            className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">Function / Department</label>
          <select
            value={func}
            onChange={e => setFunc(e.target.value)}
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
            value={seniority}
            onChange={e => setSeniority(e.target.value)}
            className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm bg-white"
          >
            {SENIORITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

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
