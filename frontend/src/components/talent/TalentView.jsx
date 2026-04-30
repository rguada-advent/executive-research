import { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import DiscoveryInput from './DiscoveryInput';
import ImportInput from './ImportInput';
import LinkedInInput from './LinkedInInput';
import SpecUpload from './SpecUpload';
import TalentDashboard from './TalentDashboard';
import TalentBriefView from './TalentBriefView';
import SearchHistory, { addToHistory, checkHistory } from './SearchHistory';

import { agentTalentResearch } from '../../services/agents/talentResearch';
import { agentLookalikes } from '../../services/agents/lookalikes';
import { agentSpecObserver } from '../../services/agents/specObserver';
import { agentQuestions } from '../../services/agents/questions';

const VIEWS = { INPUT: 'input', DB: 'db', BRIEF: 'brief' };

export default function TalentView() {
  const { state, dispatch, toast } = useApp();
  const [view, setView] = useState(VIEWS.INPUT);
  const [currentLeader, setCurrentLeader] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [searchActive, setSearchActive] = useState(false);
  const [searchLabel, setSearchLabel] = useState('');
  const abortRef = useRef(null);

  function handleDiscovered() {
    setView(VIEWS.DB);
  }

  function handleViewBrief(leader, tab = 'profile') {
    setCurrentLeader(leader);
    setActiveTab(tab);
    setView(VIEWS.BRIEF);
    dispatch({ type: 'SET_CURRENT_LEADER', payload: leader });
  }

  // Check if leader was already searched recently
  function checkRecent(leader) {
    const existing = checkHistory(leader.name, leader.company);
    if (existing) {
      const daysAgo = Math.floor((Date.now() - existing.timestamp) / (1000 * 60 * 60 * 24));
      if (daysAgo < 90) {
        toast(`${leader.name} was already researched ${daysAgo === 0 ? 'today' : daysAgo + ' days ago'}. Running again.`);
      }
    }
  }

  // Main research pipeline: Research → auto-score if spec loaded
  const runResearch = useCallback(async (leader) => {
    if (!state.apiKey) { toast('Please configure your API key.'); return; }

    checkRecent(leader);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    dispatch({ type: 'SET_RESEARCHING', payload: true });
    dispatch({ type: 'INIT_PIPELINE', payload: leader.name });

    try {
      // Agent 1: Quick Research (LinkedIn + last 2 roles)
      dispatch({ type: 'UPDATE_PIPELINE', payload: { name: leader.name, data: { state: 'research' } } });
      setSearchActive(true);
      setSearchLabel('Quick lookup: LinkedIn + career snapshot');

      const research = await agentTalentResearch(leader, {
        apiKey: state.apiKey,
        model: state.model,
        signal: ctrl.signal,
      });

      // Build a brief text from the structured research data
      const briefText = research.profileFound
        ? `# ${leader.name}\n**${leader.title}${leader.company ? ' at ' + leader.company : ''}**\n\n` +
          `## Summary\n${research.summary || 'No summary available.'}\n\n` +
          `## Current Role\n${research.currentRole ? `**${research.currentRole.title}** at ${research.currentRole.company}${research.currentRole.startDate ? ' (since ' + research.currentRole.startDate + ')' : ''}` : 'Not found.'}\n\n` +
          `## Previous Role\n${research.previousRole ? `**${research.previousRole.title}** at ${research.previousRole.company}${research.previousRole.duration ? ' (' + research.previousRole.duration + ')' : ''}` : 'Not found.'}\n\n` +
          `## Location\n${research.location || 'Not found.'}\n\n` +
          (research.linkedinUrl ? `## LinkedIn\n[View Profile](${research.linkedinUrl})\n` : '')
        : `# ${leader.name}\n**${leader.title}${leader.company ? ' at ' + leader.company : ''}**\n\nProfile not found via web search. Try verifying the name and company.`;

      dispatch({
        type: 'UPDATE_PIPELINE',
        payload: {
          name: leader.name,
          data: {
            research, professional: briefText, brief: briefText,
            completedAgents: [1],
          },
        },
      });

      // Mark done
      dispatch({
        type: 'UPDATE_PIPELINE',
        payload: { name: leader.name, data: { state: 'done' } },
      });

      setSearchActive(false);
      setSearchLabel('');

      // Save to search history
      addToHistory(leader, research);

      // Observer runs manually from the Spec Mirror tab after DD certification

      toast(`Research complete for ${leader.name}.`);
    } catch (err) {
      if (err.name === 'AbortError') {
        dispatch({ type: 'UPDATE_PIPELINE', payload: { name: leader.name, data: { state: 'stopped' } } });
        toast('Research stopped.');
      } else {
        dispatch({
          type: 'UPDATE_PIPELINE',
          payload: { name: leader.name, data: { state: 'failed', errors: { general: err.message } } },
        });
        toast('Research failed: ' + err.message);
      }
    } finally {
      dispatch({ type: 'SET_RESEARCHING', payload: false });
      setSearchActive(false);
      setSearchLabel('');
      abortRef.current = null;
    }
  }, [state.apiKey, state.model, state.specAnalysis, dispatch, toast]);

  // Extract DD observations for a leader (replaces runScoreForLeader)
  async function runObserverForLeader(leader, ctrlOverride) {
    const pipe = state.pipeline[leader.name];
    if (!pipe?.brief) { toast('Please run research first.'); return; }
    if (!state.specAnalysis) { toast('Please load management criteria first.'); return; }

    const ctrl = ctrlOverride || new AbortController();
    if (!ctrlOverride) abortRef.current = ctrl;
    dispatch({ type: 'SET_RESEARCHING', payload: true });
    dispatch({ type: 'UPDATE_PIPELINE', payload: { name: leader.name, data: { state: 'observations' } } });
    setSearchLabel('Extracting public record observations');

    try {
      const observerResult = await agentSpecObserver(leader, pipe, {
        apiKey: state.apiKey,
        model: state.model,
        signal: ctrl.signal,
        specAnalysis: state.specAnalysis,
      });
      dispatch({
        type: 'UPDATE_PIPELINE',
        payload: {
          name: leader.name,
          data: {
            observations: {
              observations: observerResult.observations || [],
              legalFlags: observerResult.legalFlags || [],
              regulatoryFlags: observerResult.regulatoryFlags || [],
            },
            state: 'done',
            completedAgents: [...(pipe.completedAgents || []), 6],
          },
        },
      });
    } catch (err) {
      if (err.name !== 'AbortError') toast('Observer failed: ' + err.message);
    } finally {
      if (!ctrlOverride) {
        dispatch({ type: 'SET_RESEARCHING', payload: false });
        setSearchLabel('');
        abortRef.current = null;
      }
    }
  }

  // Run lookalikes for a leader
  async function handleRunLookalikes() {
    if (!currentLeader) return;
    const pipe = state.pipeline[currentLeader.name];

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    dispatch({ type: 'SET_RESEARCHING', payload: true });
    dispatch({ type: 'UPDATE_PIPELINE', payload: { name: currentLeader.name, data: { state: 'lookalikes' } } });
    setSearchActive(true);
    setSearchLabel('Finding similar executives');

    try {
      const lookalikes = await agentLookalikes(currentLeader, pipe?.research, {
        apiKey: state.apiKey,
        model: state.model,
        signal: ctrl.signal,
      });
      dispatch({
        type: 'UPDATE_PIPELINE',
        payload: {
          name: currentLeader.name,
          data: {
            lookalikes,
            state: 'done',
            completedAgents: [...(pipe?.completedAgents || []), 14],
          },
        },
      });
      toast(`Found ${lookalikes.length} similar executives.`);
    } catch (err) {
      if (err.name !== 'AbortError') toast('Lookalikes failed: ' + err.message);
    } finally {
      dispatch({ type: 'SET_RESEARCHING', payload: false });
      setSearchActive(false);
      setSearchLabel('');
      abortRef.current = null;
    }
  }

  // Run questions for a leader
  async function handleRunQuestions() {
    if (!currentLeader) return;
    const pipe = state.pipeline[currentLeader.name];
    if (!pipe?.brief) { toast('Please run research first.'); return; }
    if (!state.specText) { toast('Please load a recruiting spec first.'); return; }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    dispatch({ type: 'SET_RESEARCHING', payload: true });
    setSearchLabel('Generating screening questions');

    try {
      const { agentQuestions: runQs } = await import('../../services/agents/questions');
      const questText = await runQs(currentLeader, pipe, {
        apiKey: state.apiKey,
        model: state.model,
        signal: ctrl.signal,
        specText: state.specText,
        onText: (_, acc) => {
          dispatch({ type: 'UPDATE_PIPELINE', payload: { name: currentLeader.name, data: { questions: acc } } });
        },
      });
      dispatch({
        type: 'UPDATE_PIPELINE',
        payload: { name: currentLeader.name, data: { questions: questText } },
      });
      toast('Screening questions generated.');
    } catch (err) {
      if (err.name !== 'AbortError') toast('Questions failed: ' + err.message);
    } finally {
      dispatch({ type: 'SET_RESEARCHING', payload: false });
      setSearchLabel('');
      abortRef.current = null;
    }
  }

  async function handleResearchAll() {
    const unresearched = state.leaders.filter(l => !state.pipeline[l.name]?.brief);
    dispatch({ type: 'SET_STOP_ALL', payload: false });
    for (const leader of unresearched) {
      if (state.stopAll) break;
      await runResearch(leader);
    }
  }

  function handleStopAll() {
    dispatch({ type: 'SET_STOP_ALL', payload: true });
    if (abortRef.current) abortRef.current.abort();
    dispatch({ type: 'SET_RESEARCHING', payload: false });
    toast('Stopped all research.');
  }

  function handleStopResearch() {
    if (abortRef.current) abortRef.current.abort();
    dispatch({ type: 'SET_RESEARCHING', payload: false });
    toast('Research stopped.');
  }

  // Load a leader from search history
  function handleLoadFromHistory(leader) {
    // Add to leaders list if not already there
    const exists = state.leaders.some(l =>
      l.name.toLowerCase() === leader.name.toLowerCase() &&
      (l.company || '').toLowerCase() === (leader.company || '').toLowerCase()
    );
    if (!exists) {
      dispatch({ type: 'ADD_LEADER', payload: { ...leader, source: 'History' } });
      toast(`Loaded ${leader.name} from search history.`);
    } else {
      toast(`${leader.name} is already in the current list.`);
    }
  }

  function handleRunObserver() {
    if (currentLeader) runObserverForLeader(currentLeader);
  }

  return (
    <>
      {/* INPUT VIEW */}
      {view === VIEWS.INPUT && (
        <div className="max-w-4xl mx-auto">
          <DiscoveryInput onDiscovered={handleDiscovered} />
          <LinkedInInput onAdded={handleDiscovered} />
          <ImportInput onImported={handleDiscovered} />
          <SpecUpload />
          <SearchHistory onSelectLeader={handleLoadFromHistory} />
        </div>
      )}

      {/* DB VIEW */}
      {view === VIEWS.DB && (
        <div className="max-w-6xl mx-auto">
          <TalentDashboard
            onViewBrief={handleViewBrief}
            onResearchOne={leader => {
              handleViewBrief(leader, 'profile');
              runResearch(leader);
            }}
            onResearchAll={handleResearchAll}
            onStopAll={handleStopAll}
            onBackToInput={() => setView(VIEWS.INPUT)}
          />
        </div>
      )}

      {/* BRIEF VIEW */}
      {view === VIEWS.BRIEF && currentLeader && (
        <div className="max-w-4xl mx-auto">
          <TalentBriefView
            leader={currentLeader}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onBackToDashboard={() => setView(VIEWS.DB)}
            onStopResearch={handleStopResearch}
            onRunObserver={handleRunObserver}
            onRunQuestions={handleRunQuestions}
            onRunLookalikes={handleRunLookalikes}
            searchActive={searchActive}
            searchLabel={searchLabel}
          />
        </div>
      )}
    </>
  );
}
