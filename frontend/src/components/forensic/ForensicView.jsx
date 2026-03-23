import { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import SubjectInput from './SubjectInput';
import InvestigationDashboard from './InvestigationDashboard';
import BriefView from './BriefView';

export default function ForensicView() {
  const { state, dispatch, toast } = useApp();
  const [view, setView] = useState('input'); // 'input' | 'db' | 'brief'
  const [searchActive, setSearchActive] = useState(false);
  const [searchLabel, setSearchLabel] = useState('');
  const abortCtrlRef = useRef(null);

  function goToDb() {
    dispatch({ type: 'RESET_PIPELINE' });
    setView('db');
  }

  function goToInput() {
    setView('input');
  }

  function goToBrief(leader) {
    dispatch({ type: 'SET_CURRENT_LEADER', payload: leader });
    setView('brief');
  }

  function handleStop() {
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
      abortCtrlRef.current = null;
    }
    dispatch({ type: 'SET_RESEARCHING', payload: false });
    dispatch({ type: 'SET_STOP_ALL', payload: true });
    setSearchActive(false);
  }

  const runInvestigation = useCallback(async (idx) => {
    const leader = state.leaders[idx];
    if (!leader) return;
    if (state.pipeline[leader.name]?.brief) {
      goToBrief(leader);
      return;
    }

    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;
    dispatch({ type: 'SET_RESEARCHING', payload: leader.name });
    dispatch({ type: 'SET_STOP_ALL', payload: false });
    dispatch({ type: 'INIT_PIPELINE', payload: leader.name });

    goToBrief(leader);

    try {
      const { runForensicPipeline } = await import('../../services/agents/forensicPipeline');
      await runForensicPipeline(leader, {
        signal: ctrl.signal,
        apiKey: state.apiKey,
        model: state.model,
        clToken: state.clToken,
        onUpdate: (name, data) => dispatch({ type: 'UPDATE_PIPELINE', payload: { name, data } }),
        onSearch: (active, label) => { setSearchActive(active); if (label) setSearchLabel(label); },
      });
      toast('Investigation complete: ' + leader.name);
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast('Investigation error: ' + err.message);
      } else {
        toast('Investigation stopped.');
      }
    } finally {
      abortCtrlRef.current = null;
      dispatch({ type: 'SET_RESEARCHING', payload: false });
      setSearchActive(false);
    }
  }, [state.leaders, state.pipeline, state.apiKey, state.model, state.clToken, dispatch, toast]);

  const handleInvestigateAll = useCallback(async () => {
    dispatch({ type: 'SET_STOP_ALL', payload: false });
    for (let i = 0; i < state.leaders.length; i++) {
      if (state.stopAll) break;
      const l = state.leaders[i];
      if (state.pipeline[l.name]?.brief) continue;
      await runInvestigation(i);
      if (state.stopAll) break;
    }
    dispatch({ type: 'SET_STOP_ALL', payload: false });
    dispatch({ type: 'SET_RESEARCHING', payload: false });
    toast('All investigations complete.');
    setView('db');
  }, [state.leaders, state.pipeline, state.stopAll, runInvestigation, dispatch, toast]);

  const handleView = useCallback((idx) => {
    const leader = state.leaders[idx];
    if (leader) goToBrief(leader);
  }, [state.leaders]);

  return (
    <div className="max-w-6xl mx-auto w-full">
      {view === 'input' && (
        <>
          <SubjectInput onStart={goToDb} />
        </>
      )}

      {view === 'db' && (
        <InvestigationDashboard
          onInvestigate={runInvestigation}
          onView={handleView}
          onInvestigateAll={handleInvestigateAll}
          onStopAll={handleStop}
          onAddMore={goToInput}
        />
      )}

      {view === 'brief' && (
        <BriefView
          onBack={() => setView('db')}
          onStop={handleStop}
          searchActive={searchActive}
          searchLabel={searchLabel}
        />
      )}
    </div>
  );
}
