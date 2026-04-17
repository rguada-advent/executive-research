import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { MODES } from '../utils/constants';

const AppContext = createContext(null);

// API key lives on the backend (psg_config.json) — not in sessionStorage.
// '(configured)' is a UI sentinel meaning "backend has a key, but we don't expose it here".
const BACKEND = window.psgApp?.isElectron ? 'http://127.0.0.1:5001' : '/api';

// Per-session auth token injected by the Electron preload. REQUIRED on every
// /claude/* and /proxy/* request since v1.5.3 added backend enforcement.
// Without this, config saves and status checks silently 401 → user sees
// "API key not configured" errors even after they enter their key.
function localAuthHeaders() {
  const token = window.psgApp?.localToken;
  return token ? { 'X-PSG-Local-Token': token } : {};
}

const initialState = {
  mode: MODES.FORENSIC,
  // API keys — '' = not set, '(configured)' = saved on backend, real key = being entered
  apiKey: '',         // Anthropic
  openaiApiKey: '',   // OpenAI
  geminiApiKey: '',   // Google Gemini
  model: 'claude-sonnet-4-6',
  clToken: sessionStorage.getItem('psg_cl_token') || '',
  linkedin: {},
  leaders: [],
  currentLeader: null,
  pipeline: {},
  researching: false,
  stopAll: false,
  specText: '',
  specAnalysis: null,
  calibrationCtx: '',
  toasts: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MODE': return { ...state, mode: action.payload };
    case 'SET_API_KEY':
      // No sessionStorage — key is persisted server-side via useEffect below
      return { ...state, apiKey: action.payload };
    case 'SET_OPENAI_KEY':
      return { ...state, openaiApiKey: action.payload };
    case 'SET_GEMINI_KEY':
      return { ...state, geminiApiKey: action.payload };
    case 'SET_MODEL': return { ...state, model: action.payload };
    case 'SET_CL_TOKEN':
      sessionStorage.setItem('psg_cl_token', action.payload);
      return { ...state, clToken: action.payload };
    case 'ADD_LEADER':
      return { ...state, leaders: [...state.leaders, action.payload] };
    case 'ADD_LEADERS':
      return { ...state, leaders: [...state.leaders, ...action.payload] };
    case 'REMOVE_LEADER':
      return { ...state, leaders: state.leaders.filter((_, i) => i !== action.payload) };
    case 'SET_LEADERS':
      return { ...state, leaders: action.payload };
    case 'SET_CURRENT_LEADER': return { ...state, currentLeader: action.payload };
    case 'SET_RESEARCHING': return { ...state, researching: action.payload };
    case 'SET_STOP_ALL': return { ...state, stopAll: action.payload };
    case 'UPDATE_PIPELINE':
      return {
        ...state,
        pipeline: {
          ...state.pipeline,
          [action.payload.name]: {
            ...(state.pipeline[action.payload.name] || {}),
            ...action.payload.data,
          }
        }
      };
    case 'INIT_PIPELINE':
      return {
        ...state,
        pipeline: {
          ...state.pipeline,
          [action.payload]: {
            state: 'starting', startTime: Date.now(),
            professional: null, contact: null, social: null,
            glassdoor: null, linkedin: null, legal: null,
            regulatory: null, verification: null, brief: null,
            observations: null, questions: null,
            ddCertified: null,
            completedAgents: [], failedAgents: [],
            overallConfidence: null, overallRisk: 'none', errors: {},
          }
        }
      };
    case 'RESET_PIPELINE': return { ...state, pipeline: {} };
    case 'CLEAR_ALL_DATA':
      localStorage.removeItem('psg_talent_search_history');
      return {
        ...state,
        leaders: [],
        currentLeader: null,
        pipeline: {},
        specText: '',
        specAnalysis: null,
        calibrationCtx: '',
      };
    case 'SET_SPEC': return { ...state, specText: action.payload };
    case 'SET_SPEC_ANALYSIS': return { ...state, specAnalysis: action.payload };
    case 'SET_CALIBRATION': return { ...state, calibrationCtx: action.payload };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { id: action.payload.id, message: action.payload.message }] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toast = useCallback((msg) => {
    const id = Date.now() + Math.random();
    dispatch({ type: 'ADD_TOAST', payload: { id, message: msg } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3000);
  }, []);

  // On mount: check which providers the backend already has keys for.
  // Retries because the Flask backend may still be starting up when the renderer loads.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function check() {
      while (!cancelled && attempts < 8) {
        attempts++;
        try {
          const r = await fetch(`${BACKEND}/claude/status`, {
            headers: { ...localAuthHeaders() },
          });
          if (r.ok) {
            const data = await r.json();
            if (!cancelled) {
              const providers = data.providers || {};
              if (providers.anthropic || data.configured)
                dispatch({ type: 'SET_API_KEY',      payload: '(configured)' });
              if (providers.openai)
                dispatch({ type: 'SET_OPENAI_KEY',   payload: '(configured)' });
              if (providers.gemini)
                dispatch({ type: 'SET_GEMINI_KEY',   payload: '(configured)' });
            }
            return;
          }
        } catch (_) {
          // Backend not yet ready — retry after a delay.
        }
        await new Promise(res => setTimeout(res, 500 + attempts * 300));
      }
    }
    check();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When user enters a new real key, persist it to the backend.
  // Debounced so we don't POST on every keystroke while the user is typing.
  useEffect(() => {
    const key = state.apiKey;
    if (!key || key === '(configured)') return;
    // Only save if the key looks plausibly valid — avoids spamming the
    // backend with partial keystrokes and the resulting 400 errors.
    if (!key.startsWith('sk-ant-') || key.length < 40) return;

    const timeoutId = setTimeout(async () => {
      try {
        const r = await fetch(`${BACKEND}/claude/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...localAuthHeaders() },
          body: JSON.stringify({ apiKey: key }),
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.status === 'ok') {
          dispatch({ type: 'SET_API_KEY', payload: '(configured)' });
          const saved = Date.now() + Math.random();
          dispatch({ type: 'ADD_TOAST', payload: { id: saved, message: 'API key saved.' } });
          setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: saved }), 2500);
        } else {
          const msg = data.error || `Failed to save key (HTTP ${r.status}). The backend may not have started yet — try again in a moment.`;
          const id = Date.now() + Math.random();
          dispatch({ type: 'ADD_TOAST', payload: { id, message: msg } });
          setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 5000);
        }
      } catch (err) {
        const id = Date.now() + Math.random();
        dispatch({ type: 'ADD_TOAST', payload: { id, message: 'Could not reach local backend to save API key. Restart the app and try again.' } });
        setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 5000);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [state.apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist OpenAI API key when it changes
  useEffect(() => {
    const key = state.openaiApiKey;
    if (!key || key === '(configured)') return;
    if (!key.startsWith('sk-') || key.length < 20) return;

    const timeoutId = setTimeout(async () => {
      try {
        const r = await fetch(`${BACKEND}/claude/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...localAuthHeaders() },
          body: JSON.stringify({ openaiApiKey: key }),
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.status === 'ok') {
          dispatch({ type: 'SET_OPENAI_KEY', payload: '(configured)' });
          const id = Date.now() + Math.random();
          dispatch({ type: 'ADD_TOAST', payload: { id, message: 'OpenAI API key saved.' } });
          setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 2500);
        } else {
          const id = Date.now() + Math.random();
          dispatch({ type: 'ADD_TOAST', payload: { id, message: data.error || `Failed to save OpenAI key (HTTP ${r.status}).` } });
          setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 5000);
        }
      } catch (_) {
        const id = Date.now() + Math.random();
        dispatch({ type: 'ADD_TOAST', payload: { id, message: 'Could not reach local backend to save OpenAI key.' } });
        setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 5000);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [state.openaiApiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist Gemini API key when it changes
  useEffect(() => {
    const key = state.geminiApiKey;
    if (!key || key === '(configured)') return;
    if (!key.startsWith('AIza') || key.length < 20) return;

    const timeoutId = setTimeout(async () => {
      try {
        const r = await fetch(`${BACKEND}/claude/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...localAuthHeaders() },
          body: JSON.stringify({ geminiApiKey: key }),
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.status === 'ok') {
          dispatch({ type: 'SET_GEMINI_KEY', payload: '(configured)' });
          const id = Date.now() + Math.random();
          dispatch({ type: 'ADD_TOAST', payload: { id, message: 'Gemini API key saved.' } });
          setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 2500);
        } else {
          const id = Date.now() + Math.random();
          dispatch({ type: 'ADD_TOAST', payload: { id, message: data.error || `Failed to save Gemini key (HTTP ${r.status}).` } });
          setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 5000);
        }
      } catch (_) {
        const id = Date.now() + Math.random();
        dispatch({ type: 'ADD_TOAST', payload: { id, message: 'Could not reach local backend to save Gemini key.' } });
        setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 5000);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [state.geminiApiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppContext.Provider value={{ state, dispatch, toast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
