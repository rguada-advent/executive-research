import { createContext, useContext, useReducer, useCallback } from 'react';
import { MODES } from '../utils/constants';

const AppContext = createContext(null);

const initialState = {
  mode: MODES.FORENSIC,
  apiKey: sessionStorage.getItem('psg_api_key') || '',
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
      sessionStorage.setItem('psg_api_key', action.payload);
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
