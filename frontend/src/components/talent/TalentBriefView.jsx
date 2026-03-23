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
  { id: 'profile', label: 'Profile', always: true },
  { id: 'lookalikes', label: 'Lookalikes', always: true },
  { id: 'scorecard', label: 'Fit Assessment', requiresSpec: true },
  { id: 'questions', label: 'Questions', requiresSpec: true },
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
    <div>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button
          onClick={onBackToDashboard}
          className="bg-white border border-advent-gray-350 text-advent-gray-700 px-4 py-1.5 rounded text-sm font-semibold hover:bg-advent-gray-100"
        >
          &larr; Back to Dashboard
        </button>
        <div className="flex flex-wrap gap-2">
          {isResearching && (
            <button
              onClick={onStopResearch}
              className="bg-red-600 text-white px-4 py-1.5 rounded text-sm font-semibold hover:opacity-90"
            >
              Stop Research
            </button>
          )}
          <ExportButton
            targetRef={exportRef}
            filename={`${leader.name} - Executive Brief`}
            label="Export PDF"
          />
          <button
            onClick={() => window.print()}
            className="bg-white border border-advent-gray-350 text-advent-gray-700 px-4 py-1.5 rounded text-sm font-semibold hover:bg-advent-gray-100"
          >
            Print
          </button>
        </div>
      </div>

      {/* Leader name + LinkedIn link */}
      <div className="mb-3">
        <h1 className="text-lg font-bold text-advent-navy">{leader.name}</h1>
        <div className="flex items-center gap-3">
          {leader.title && <p className="text-sm text-advent-gray-500">{leader.title}{leader.company ? ` at ${leader.company}` : ''}</p>}
          {pipe.research?.linkedinUrl && (
            <a href={pipe.research.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs text-[#0a66c2] font-semibold hover:underline">
              LinkedIn &rarr;
            </a>
          )}
        </div>
      </div>

      {/* Pipeline tracker */}
      <PipelineTracker
        stages={TALENT_PIPELINE_STAGES}
        pipeline={pipeline}
        name={leader.name}
      />

      {/* Search indicator */}
      <SearchIndicator active={searchActive} label={searchLabel} />

      {/* Tab bar */}
      <div className="flex flex-wrap mb-4">
        {visibleTabs.map((tab, i) => {
          const isActive = activeTab === tab.id;
          const roundLeft = i === 0 ? 'rounded-l-md' : '';
          const roundRight = i === visibleTabs.length - 1 ? 'rounded-r-md' : '';
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-5 py-2.5 border text-sm font-semibold transition-colors ${roundLeft} ${roundRight} ${
                isActive
                  ? 'bg-advent-blue text-white border-advent-blue'
                  : 'bg-white text-advent-gray-500 border-advent-gray-350 hover:bg-advent-gray-100'
              }`}
            >
              {tab.label}
              {tab.id === 'lookalikes' && lookalikes?.length ? ` (${lookalikes.length})` : ''}
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
