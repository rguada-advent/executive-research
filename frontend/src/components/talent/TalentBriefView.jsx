import { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import PipelineTracker from '../shared/PipelineTracker';
import SearchIndicator from '../shared/SearchIndicator';
import ExportButton from '../shared/ExportButton';
import ProfileTab from './tabs/ProfileTab';
import LookalikesTab from './tabs/LookalikesTab';
import ScorecardTab from './tabs/ScorecardTab';
import QuestionsTab from './tabs/QuestionsTab';
import { TALENT_PIPELINE_STAGES } from '../../utils/constants';

const ALL_TABS = [
  { id: 'profile',    label: 'Profile',         always: true },
  { id: 'lookalikes', label: 'Lookalikes',      always: true },
  { id: 'scorecard',  label: 'Fit Assessment',  requiresSpec: true },
  { id: 'questions',  label: 'Questions',       requiresSpec: true },
];

export default function TalentBriefView({
  leader,
  activeTab,
  onTabChange,
  onBackToDashboard,
  onStopResearch,
  onRunScore,
  onRunQuestions,
  onRunLookalikes,
  searchActive,
  searchLabel,
}) {
  const { state } = useApp();
  const { pipeline, specAnalysis, researching } = state;
  const exportRef = useRef(null);

  if (!leader) return null;

  const pipe = pipeline[leader.name] || {};
  const brief = pipe.brief || null;
  const scoring = pipe.scoring || null;
  const questions = pipe.questions || null;
  const lookalikes = pipe.lookalikes || null;
  const isResearching = researching && pipe.state !== 'done';

  const visibleTabs = ALL_TABS.filter(t => t.always || (t.requiresSpec && specAnalysis));

  return (
    <div className="psg-fade-up">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 psg-no-print">
        <button onClick={onBackToDashboard} className="psg-btn psg-btn-ghost">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Dashboard
        </button>
        <div className="flex flex-wrap gap-2">
          {isResearching && (
            <button onClick={onStopResearch} className="psg-btn psg-btn-danger">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
              Stop Research
            </button>
          )}
          <ExportButton
            targetRef={exportRef}
            filename={`${leader.name} - Executive Brief`}
            label="Export PDF"
          />
          <button onClick={() => window.print()} className="psg-btn psg-btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
        </div>
      </div>

      {/* Subject header card */}
      <div className="psg-card p-5 mb-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-advent-navy text-white font-bold text-lg flex items-center justify-center shadow-sm">
          {leader.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-advent-navy tracking-tight truncate">{leader.name}</h1>
          <div className="flex items-center gap-3 text-sm text-advent-gray-500 truncate">
            {leader.title && <span className="truncate">{leader.title}{leader.company ? ` · ${leader.company}` : ''}</span>}
            {pipe.research?.linkedinUrl && (
              <a href={pipe.research.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0a66c2] hover:underline shrink-0">
                LinkedIn
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <PipelineTracker
        stages={TALENT_PIPELINE_STAGES}
        pipeline={pipeline}
        name={leader.name}
      />

      {/* Search indicator */}
      <SearchIndicator active={searchActive} label={searchLabel} />

      {/* Tab bar */}
      <div className="flex border-b border-[var(--border-subtle)] mb-5 overflow-x-auto psg-no-print">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tab.id === 'lookalikes' && lookalikes?.length ? lookalikes.length : null;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-4 py-3 text-[13px] font-semibold tracking-tight whitespace-nowrap transition-colors duration-150 inline-flex items-center gap-1.5 ${
                isActive ? 'text-advent-navy' : 'text-advent-gray-500 hover:text-advent-navy'
              }`}
            >
              {tab.label}
              {count !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-advent-navy text-white' : 'bg-advent-gray-100 text-advent-gray-700'}`}>
                  {count}
                </span>
              )}
              {isActive && <span className="absolute left-3 right-3 bottom-0 h-[3px] bg-advent-gold rounded-t" aria-hidden />}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div ref={exportRef}>
        {activeTab === 'profile' && (
          <ProfileTab brief={brief} loading={isResearching} />
        )}
        {activeTab === 'lookalikes' && (
          <LookalikesTab
            lookalikes={lookalikes}
            loading={isResearching && pipe.state === 'lookalikes'}
            onRunLookalikes={onRunLookalikes}
          />
        )}
        {activeTab === 'scorecard' && (
          <ScorecardTab
            scoring={scoring}
            leaderName={leader.name}
            onRunScore={onRunScore}
            specLoaded={!!specAnalysis}
          />
        )}
        {activeTab === 'questions' && (
          <QuestionsTab
            questions={questions}
            loading={isResearching}
            onRunQuestions={onRunQuestions}
            specLoaded={!!specAnalysis}
          />
        )}
      </div>
    </div>
  );
}
