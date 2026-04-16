import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import PipelineTracker from '../shared/PipelineTracker';
import SearchIndicator from '../shared/SearchIndicator';
import ExportButton from '../shared/ExportButton';
import { FORENSIC_PIPELINE_STAGES } from '../../utils/constants';

const AGENT_LABELS = {
  1: 'Professional Research',
  2: 'Contact Intelligence',
  3: 'Social Media',
  4: 'Verification',
  5: 'Brief Synthesis',
  10: 'Legal Research',
  11: 'Regulatory Compliance',
  12: 'LinkedIn Research',
  13: 'Glassdoor & Culture',
};

function FailureBanner({ failedAgents = [], errors = {} }) {
  if (!failedAgents.length) return null;
  return (
    <div className="psg-card overflow-hidden mb-4 psg-no-print">
      <div className="h-1 bg-amber-500" />
      <div className="p-4 flex items-start gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-advent-navy">
            Partial results — {failedAgents.length} {failedAgents.length === 1 ? 'module' : 'modules'} couldn't complete
          </div>
          <div className="text-[12px] text-advent-gray-700 mt-1.5 space-y-1">
            {failedAgents.map(id => {
              const label = AGENT_LABELS[id] || `Agent ${id}`;
              const err = errors[id];
              return (
                <div key={id}>
                  <span className="font-semibold text-advent-navy">{label}:</span>{' '}
                  <span className="text-advent-gray-500">{err || 'failed without details'}</span>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-advent-gray-500 mt-2 leading-relaxed">
            Common cause: Anthropic API rate limits during parallel web searches. Wait ~60 seconds and re-investigate, or the other modules will compensate.
          </div>
        </div>
      </div>
    </div>
  );
}
import ProfileTab from './tabs/ProfileTab';
import SocialTab from './tabs/SocialTab';
import GlassdoorTab from './tabs/GlassdoorTab';
import LegalTab from './tabs/LegalTab';
import VerificationTab from './tabs/VerificationTab';
import RiskTab from './tabs/RiskTab';

const TABS = [
  { id: 'profile', label: 'Profile Brief' },
  { id: 'social', label: 'Social & Media' },
  { id: 'glassdoor', label: 'Glassdoor' },
  { id: 'legal', label: 'Legal & Regulatory' },
  { id: 'verification', label: 'Verification' },
  { id: 'risk', label: 'Risk Summary' },
];

export default function BriefView({ onBack, onStop, searchActive, searchLabel }) {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const exportRef = useRef(null);

  const { currentLeader, pipeline, researching } = state;
  if (!currentLeader) return null;

  const pipe = pipeline[currentLeader.name];
  const isActive = researching === currentLeader.name;
  const exportFilename = currentLeader.name + '_' + activeTab;

  function renderPanel() {
    if (!pipe) return null;
    switch (activeTab) {
      case 'profile':
        return <ProfileTab brief={pipe.brief} pipe={pipe} />;
      case 'social':
        return <SocialTab social={pipe.social} linkedin={pipe.linkedin} />;
      case 'glassdoor':
        return <GlassdoorTab glassdoor={pipe.glassdoor} />;
      case 'legal':
        return <LegalTab legal={pipe.legal} regulatory={pipe.regulatory} />;
      case 'verification':
        return <VerificationTab verification={pipe.verification} />;
      case 'risk':
        return <RiskTab pipe={pipe} leader={currentLeader} />;
      default:
        return null;
    }
  }

  return (
    <div className="psg-fade-up">
      {/* Brief Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2 brief-header psg-no-print">
        <button onClick={onBack} className="psg-btn psg-btn-ghost">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Dashboard
        </button>
        <div className="flex gap-2 flex-wrap">
          {isActive && (
            <button onClick={onStop} className="psg-btn psg-btn-danger">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
              Stop Research
            </button>
          )}
          <ExportButton targetRef={exportRef} filename={exportFilename} label="Export PDF" />
          <button onClick={() => window.print()} className="psg-btn psg-btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
        </div>
      </div>

      {/* Subject header card */}
      <div className="psg-card p-5 mb-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-advent-navy text-white font-bold text-lg flex items-center justify-center shadow-sm">
          {currentLeader.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-advent-navy tracking-tight truncate">{currentLeader.name}</h1>
          {currentLeader.title && (
            <p className="text-sm text-advent-gray-500 truncate">
              {currentLeader.title}{currentLeader.company ? ` · ${currentLeader.company}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Pipeline */}
      {pipe && (
        <PipelineTracker
          stages={FORENSIC_PIPELINE_STAGES}
          pipeline={pipeline}
          name={currentLeader.name}
        />
      )}

      {/* Failure banner */}
      {pipe && (
        <FailureBanner
          failedAgents={pipe.failedAgents || []}
          errors={pipe.errors || {}}
        />
      )}

      {/* Tab Bar */}
      <div className="flex border-b border-[var(--border-subtle)] mb-5 brief-tabs overflow-x-auto psg-no-print">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 text-[13px] font-semibold tracking-tight whitespace-nowrap transition-colors duration-150 ${
                active ? 'text-advent-navy' : 'text-advent-gray-500 hover:text-advent-navy'
              }`}
            >
              {tab.label}
              {active && <span className="absolute left-3 right-3 bottom-0 h-[3px] bg-advent-gold rounded-t" aria-hidden />}
            </button>
          );
        })}
      </div>

      {/* Search Status */}
      <SearchIndicator active={searchActive} label={searchLabel} />

      {/* Panel Content */}
      <div ref={exportRef}>
        {renderPanel()}
      </div>
    </div>
  );
}
