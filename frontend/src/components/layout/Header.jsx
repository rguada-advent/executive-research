import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MODELS, PROVIDER_LABELS } from '../../utils/constants';

// ── Provider icon badges ─────────────────────────────────────────────────────
function ProviderBadge({ provider }) {
  const colors = {
    anthropic: 'bg-[#d97706]/10 text-[#b45309] border-[#d97706]/25',
    openai:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    gemini:    'bg-blue-50 text-blue-700 border-blue-200',
  };
  const labels = { anthropic: 'Anthropic', openai: 'OpenAI', gemini: 'Gemini' };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${colors[provider] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {labels[provider] || provider}
    </span>
  );
}

// ── Single API key row ───────────────────────────────────────────────────────
function ApiKeyRow({ provider, stateKey, placeholder, dispatchType, state, dispatch }) {
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const isConfigured = stateKey === '(configured)';
  const label = PROVIDER_LABELS[provider] || provider;

  const prefixMap = { anthropic: 'sk-ant-', openai: 'sk-', gemini: 'AIza' };
  const minLen    = { anthropic: 40,         openai: 20,    gemini: 20 };
  const prefix    = prefixMap[provider] || '';
  const min       = minLen[provider] || 20;

  async function handleSave() {
    const trimmed = input.trim();
    if (prefix && !trimmed.startsWith(prefix)) {
      setErr(`Key must start with ${prefix}`);
      return;
    }
    if (trimmed.length < min) {
      setErr('Key looks too short — check you copied it in full');
      return;
    }
    setSaving(true);
    setErr('');
    dispatch({ type: dispatchType, payload: trimmed });
    setTimeout(() => { setSaving(false); setInput(''); }, 800);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="psg-label mb-0">{label} API Key</span>
          <ProviderBadge provider={provider} />
        </div>
        {isConfigured && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Saved
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setErr(''); }}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
          placeholder={isConfigured ? '● Saved — paste a new key to replace' : placeholder}
          className="psg-input font-mono text-xs flex-1"
        />
        <button
          onClick={handleSave}
          disabled={!input.trim() || saving}
          className="psg-btn psg-btn-primary px-4 shrink-0"
        >
          {saving ? '…' : 'Save'}
        </button>
      </div>
      {err && <p className="text-[11px] text-red-600 mt-1.5 font-medium">{err}</p>}
    </div>
  );
}

// ── Settings drawer ──────────────────────────────────────────────────────────
function SettingsDrawer({ onClose }) {
  const { state, dispatch } = useApp();

  // Group models by provider for the grouped <select>
  const providerGroups = Object.entries(
    MODELS.reduce((acc, m) => {
      (acc[m.provider] = acc[m.provider] || []).push(m);
      return acc;
    }, {})
  );

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-4 top-16 w-96 bg-white rounded-xl shadow-2xl border border-[var(--border-subtle)] z-50 psg-slide-down overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--color-advent-gray-75)]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-advent-gold" />
            <h3 className="font-semibold text-advent-navy tracking-tight">Session Configuration</h3>
          </div>
          <button onClick={onClose} className="text-advent-gray-500 hover:text-advent-navy text-xl leading-none" aria-label="Close">×</button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* Model selector — grouped by provider */}
          <div>
            <label className="psg-label">AI Model</label>
            <div className="relative">
              <select
                value={state.model}
                onChange={e => dispatch({ type: 'SET_MODEL', payload: e.target.value })}
                className="psg-input psg-select"
              >
                {providerGroups.map(([prov, models]) => (
                  <optgroup key={prov} label={PROVIDER_LABELS[prov] || prov}>
                    {models.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {/* Show which provider the current model belongs to */}
            {(() => {
              const currentModel = MODELS.find(m => m.value === state.model);
              const prov = currentModel?.provider;
              const keyMap = { anthropic: state.apiKey, openai: state.openaiApiKey, gemini: state.geminiApiKey };
              const hasKey = keyMap[prov] === '(configured)';
              return prov ? (
                <p className="text-[11px] mt-1.5 flex items-center gap-1.5">
                  <ProviderBadge provider={prov} />
                  {hasKey
                    ? <span className="text-emerald-600 font-medium">API key configured ✓</span>
                    : <span className="text-amber-600 font-medium">API key required — enter it below</span>
                  }
                </p>
              ) : null;
            })()}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-advent-gray-350">API Keys</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          {/* Anthropic */}
          <ApiKeyRow
            provider="anthropic"
            stateKey={state.apiKey}
            placeholder="sk-ant-..."
            dispatchType="SET_API_KEY"
            state={state}
            dispatch={dispatch}
          />

          {/* OpenAI */}
          <ApiKeyRow
            provider="openai"
            stateKey={state.openaiApiKey}
            placeholder="sk-..."
            dispatchType="SET_OPENAI_KEY"
            state={state}
            dispatch={dispatch}
          />

          {/* Gemini */}
          <ApiKeyRow
            provider="gemini"
            stateKey={state.geminiApiKey}
            placeholder="AIza..."
            dispatchType="SET_GEMINI_KEY"
            state={state}
            dispatch={dispatch}
          />

          {/* Key storage notice */}
          <p className="text-[11px] text-advent-gray-500 leading-relaxed -mt-2">
            Keys are stored locally in <span className="font-mono">%APPDATA%\PSG Executive Intelligence</span> and never transmitted to PSG servers.
          </p>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-advent-gray-350">Integrations</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          {/* CourtListener */}
          <div>
            <label className="psg-label">CourtListener Token <span className="text-advent-gray-350 normal-case font-normal tracking-normal">(optional)</span></label>
            <input
              type="password"
              value={state.clToken}
              onChange={e => dispatch({ type: 'SET_CL_TOKEN', payload: e.target.value })}
              placeholder="Token for legal search"
              className="psg-input font-mono text-xs"
            />
          </div>
        </div>

        {/* Footer — danger zone */}
        <div className="p-5 pt-4 border-t border-[var(--border-subtle)] bg-[var(--color-advent-gray-75)]">
          <button
            onClick={() => {
              if (window.confirm('Permanently delete all research data, candidates, and search history from this device?')) {
                dispatch({ type: 'CLEAR_ALL_DATA' });
                onClose();
              }
            }}
            className="w-full bg-red-50 border border-red-200 text-red-700 py-2.5 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors tracking-wide"
          >
            Clear All Research Data
          </button>
          <p className="text-[10px] text-advent-gray-500 text-center mt-2 leading-relaxed">
            All research is stored locally on this device. Executive names and public record information are sent to the selected AI provider for processing. For investment due diligence use only — not for employment screening purposes.
          </p>
        </div>
      </div>
    </>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────
export default function Header() {
  const { state } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Determine if the currently-selected model's provider has a key
  const currentModel = MODELS.find(m => m.value === state.model);
  const currentProvider = currentModel?.provider || 'anthropic';
  const keyMap = { anthropic: state.apiKey, openai: state.openaiApiKey, gemini: state.geminiApiKey };
  const apiReady = !!(keyMap[currentProvider] && keyMap[currentProvider] !== '');

  const modelLabel = MODELS.find(m => m.value === state.model)?.label || state.model;
  const providerLabel = PROVIDER_LABELS[currentProvider] || currentProvider;

  return (
    <header
      className={`sticky top-0 z-30 bg-advent-navy/95 backdrop-blur-xl text-white transition-shadow duration-200 border-b ${scrolled ? 'shadow-lg border-white/5' : 'border-white/10'}`}
    >
      <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center gap-4">
        {/* Brand lockup */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="w-2 h-2 bg-advent-gold rotate-45 inline-block" aria-hidden />
          <span className="text-[15px] font-bold tracking-tight">PSG</span>
          <span className="w-px h-4 bg-white/20" aria-hidden />
          <span className="text-[13px] font-medium text-white/90 tracking-tight">
            Executive <span className="border-b-2 border-advent-gold pb-[1px]">Intelligence</span>
          </span>
          {window.psgApp?.version && (
            <span className="text-[10px] text-white/40 font-mono ml-2">v{window.psgApp.version}</span>
          )}
        </div>

        {/* Center status chip */}
        <div className="flex items-center gap-2 ml-6">
          <span className={`relative flex h-2 w-2 ${apiReady ? '' : 'opacity-60'}`}>
            {apiReady && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${apiReady ? 'bg-emerald-400' : 'bg-white/30'}`} />
          </span>
          <span className="text-[11px] text-white/60 font-medium tracking-wide">
            {apiReady
              ? `Connected · ${modelLabel} · ${providerLabel}`
              : `${providerLabel} API key required`}
          </span>
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 text-[12px] text-white/80 hover:text-white hover:bg-white/10 px-3 h-9 rounded-lg transition-colors duration-150 font-medium"
            title="Session settings"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>
        </div>
      </div>

      {showSettings && <SettingsDrawer onClose={() => setShowSettings(false)} />}
    </header>
  );
}
