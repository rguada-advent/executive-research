import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { MODES } from '../utils/constants';

const AppContext = createContext(null);

// API key lives on the backend (psg_config.json) — not in sessionStorage.
// '(configured)' is a UI sentinel meaning "backend has a key, but we don't expose it here".
const BACKEND = window.psgApp?.isElectron ? 'http://127.0.0.1:5001' : '/api';

const initialState = {
  mode: MODES.FORENSIC,
  apiKey: '',         // '' = not set, '(configured)' = saved on backend, real key = being entered
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
            scoring: null, questions: null,
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

  // On mount: check if backend already has a key configured from a previous session
  useEffect(() => {
    fetch(`${BACKEND}/claude/status`)
      .then(r => r.json())
      .then(data => {
        if (data.configured) {
          dispatch({ type: 'SET_API_KEY', payload: '(configured)' });
        }
      })
      .catch(() => {}); // backend not yet ready — silently ignore, user can enter key manually
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When user enters a new real key, persist it to the backend
  useEffect(() => {
    const key = state.apiKey;
    if (!key || key === '(configured)') return;
    fetch(`${BACKEND}/claude/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.status === 'ok') {
          // Replace plaintext key with sentinel so it's not exposed in state
          dispatch({ type: 'SET_API_KEY', payload: '(configured)' });
        }
      })
      .catch(() => {}); // persist failure is non-fatal; key is still in-memory for this session
  }, [state.apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
