import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { testLinkedIn } from '../../services/backendApi';

export default function LinkedInSetup() {
  const { state, dispatch, toast } = useApp();
  const [open, setOpen] = useState(false);
  const li = state.linkedin;

  const statusMap = {
    none: { dot: 'bg-advent-gray-500', text: 'Not configured' },
    untested: { dot: 'bg-risk-medium', text: 'Untested' },
    testing: { dot: 'bg-risk-medium animate-pulse', text: 'Testing...' },
    connected: { dot: 'bg-risk-none', text: 'Connected' },
    expired: { dot: 'bg-risk-high', text: 'Invalid / Expired' },
  };
  const status = statusMap[li.status] || statusMap.none;

  async function handleTest() {
    if (!li.liAt || !li.jsessionId) {
      toast('Both li_at and JSESSIONID cookies are required.');
      return;
    }
    dispatch({ type: 'SET_LINKEDIN', payload: { status: 'testing' } });
    try {
      const result = await testLinkedIn(li.liAt, li.jsessionId);
      if (result.connected) {
        dispatch({ type: 'SET_LINKEDIN', payload: { status: 'connected', user: result.data } });
        toast(result.name ? `LinkedIn connected as: ${result.name}` : 'LinkedIn connection verified.');
      } else {
        dispatch({ type: 'SET_LINKEDIN', payload: { status: 'expired' } });
        toast(result.error || 'LinkedIn cookies expired or invalid.');
      }
    } catch (e) {
      dispatch({ type: 'SET_LINKEDIN', payload: { status: 'expired' } });
      toast('LinkedIn test failed: ' + e.message);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#0a66c2]/30 p-6 mb-4">
      <h2
        className="text-base font-bold text-[#0a66c2] cursor-pointer select-none flex items-center gap-2"
        onClick={() => setOpen(!open)}
      >
        <span className="w-1 h-5 bg-[#0a66c2] rounded" />
        LinkedIn Access (Optional)
        <span className="ml-2 flex items-center gap-1.5 text-xs font-normal text-advent-gray-500">
          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
          {status.text}
        </span>
        <span className="ml-auto text-xs">{open ? '\u25BE' : '\u25B8'}</span>
      </h2>

      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-advent-gray-500">
            Provide your LinkedIn session cookies for profile verification and connection degree scanning. Both cookies are required.
          </p>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">Session Cookie (li_at)</label>
              <input
                type="password"
                value={li.liAt}
                onChange={e => dispatch({ type: 'SET_LINKEDIN', payload: { liAt: e.target.value, status: 'untested' } })}
                placeholder="Paste your li_at cookie value"
                className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">CSRF Cookie (JSESSIONID)</label>
              <input
                type="password"
                value={li.jsessionId}
                onChange={e => dispatch({ type: 'SET_LINKEDIN', payload: { jsessionId: e.target.value, status: 'untested' } })}
                placeholder='Paste JSESSIONID (starts with "ajax:")'
                className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm"
              />
            </div>
            <button onClick={handleTest} className="bg-advent-gray-200 border border-advent-gray-350 text-advent-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-advent-gray-350 h-[38px]">
              Test Connection
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-advent-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={li.scanConnections}
              onChange={e => dispatch({ type: 'SET_LINKEDIN', payload: { scanConnections: e.target.checked } })}
              className="accent-advent-blue"
            />
            Scan connection degrees (find 2nd/3rd degree links to candidates)
          </label>
          <details className="text-xs text-advent-gray-500">
            <summary className="cursor-pointer">How to get your LinkedIn cookies</summary>
            <ol className="mt-2 ml-4 list-decimal space-y-1">
              <li>Log into LinkedIn in your browser</li>
              <li>Open DevTools (F12) → Application → Cookies → linkedin.com</li>
              <li>Find <code className="bg-advent-gray-200 px-1 rounded">li_at</code> — copy its value</li>
              <li>Find <code className="bg-advent-gray-200 px-1 rounded">JSESSIONID</code> — copy its value (include quotes if present)</li>
              <li>Click "Test Connection" to verify</li>
            </ol>
          </details>
        </div>
      )}
    </div>
  );
}
