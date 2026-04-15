import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MODELS } from '../../utils/constants';

function DataPracticesPanel({ onClose }) {
  const { dispatch } = useApp();

  function handleClearAll() {
    if (window.confirm('This will permanently delete all research data, candidates, and search history from this device. Continue?')) {
      dispatch({ type: 'CLEAR_ALL_DATA' });
      onClose();
    }
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 z-50 text-sm text-gray-700">
      <h3 className="font-bold text-advent-navy mb-3">Data Practices</h3>
      <div className="space-y-2 mb-4 text-xs leading-relaxed">
        <p><strong>Storage:</strong> All candidate research is stored locally on your device only — no data is sent to PSG servers.</p>
        <p><strong>AI Processing:</strong> Candidate names and publicly available information are sent to Anthropic's Claude API. Anthropic's privacy policy applies.</p>
        <p><strong>Purpose:</strong> For professional executive research only. AI assessments are advisory — human review is required before any employment decision.</p>
        <p><strong>Your rights:</strong> You may request deletion of any data about yourself by contacting your PSG administrator.</p>
      </div>
      <button
        onClick={handleClearAll}
        className="w-full bg-red-50 border border-red-200 text-red-700 py-2 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
      >
        Clear All Research Data
      </button>
    </div>
  );
}

export default function Header() {
  const { state, dispatch } = useApp();
  const [showDataPanel, setShowDataPanel] = useState(false);

  return (
    <header className="bg-advent-navy text-white px-6 py-3 flex items-center gap-4 shrink-0 relative">
      <h1 className="text-lg font-bold whitespace-nowrap flex items-baseline gap-2">
        PSG <span className="text-advent-gold">Human Capital</span>
        <span className="text-advent-gray-350 font-normal text-sm">Executive Intelligence</span>
        {window.psgApp?.version && (
          <span className="text-advent-gray-500 font-mono font-normal text-xs">v{window.psgApp.version}</span>
        )}
      </h1>
      <div className="flex items-center gap-3 ml-auto">
        <label className="text-xs text-advent-gray-350">Model</label>
        <select
          value={state.model}
          onChange={e => dispatch({ type: 'SET_MODEL', payload: e.target.value })}
          className="bg-advent-navy border border-advent-gray-500 text-white px-2 py-1.5 rounded text-sm"
        >
          {MODELS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <label className="text-xs text-advent-gray-350">API Key</label>
        <input
          type="password"
          value={state.apiKey === '(configured)' ? '' : state.apiKey}
          onChange={e => dispatch({ type: 'SET_API_KEY', payload: e.target.value })}
          placeholder={state.apiKey === '(configured)' ? '● API key saved' : 'sk-ant-...'}
          className="bg-advent-navy border border-advent-gray-500 text-white px-2 py-1.5 rounded text-sm w-56"
        />
        <label className="text-xs text-advent-gold">CourtListener</label>
        <input
          type="password"
          value={state.clToken}
          onChange={e => dispatch({ type: 'SET_CL_TOKEN', payload: e.target.value })}
          placeholder="CL token (optional)"
          className="bg-advent-navy border border-advent-gray-500 text-white px-2 py-1.5 rounded text-sm w-40"
        />
        <div className="relative">
          <button
            onClick={() => setShowDataPanel(p => !p)}
            className="text-xs text-advent-gray-400 hover:text-white border border-advent-gray-500 px-2 py-1.5 rounded transition-colors"
            title="Data Practices"
          >
            Data Practices
          </button>
          {showDataPanel && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDataPanel(false)} />
              <DataPracticesPanel onClose={() => setShowDataPanel(false)} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
