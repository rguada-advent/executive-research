import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import PipelineTracker from '../shared/PipelineTracker';
import SearchIndicator from '../shared/SearchIndicator';
import ExportButton from '../shared/ExportButton';
import { FORENSIC_PIPELINE_STAGES } from '../../utils/constants';
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
        return <ProfileTab brief={pipe.brief} />;
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
    <div>
      {/* Brief Header */}
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2 brief-header">
        <button
          onClick={onBack}
          className="bg-advent-gray-200 border border-advent-gray-350 text-advent-gray-700 px-4 py-1.5 rounded text-sm font-medium hover:bg-advent-gray-350"
        >
          &larr; Back to Dashboard
        </button>
        <div className="flex gap-2 flex-wrap">
          {isActive && (
            <button
              onClick={onStop}
              className="bg-risk-high text-white px-4 py-1.5 rounded text-sm font-semibold hover:opacity-90"
            >
              Stop Research
            </button>
          )}
          <ExportButton targetRef={exportRef} filename={exportFilename} label="Export PDF" />
          <button
            onClick={() => window.print()}
            className="bg-advent-gray-200 border border-advent-gray-350 text-advent-gray-700 px-4 py-1.5 rounded text-sm font-medium hover:bg-advent-gray-350"
          >
            Print
          </button>
        </div>
      </div>

      {/* Pipeline Tracker */}
      {pipe && (
        <PipelineTracker
          stages={FORENSIC_PIPELINE_STAGES}
          pipeline={pipeline}
          name={currentLeader.name}
        />
      )}

      {/* Tab Bar */}
      <div className="flex flex-wrap mb-4 brief-tabs">
        {TABS.map((tab, i) => {
          const isFirst = i === 0;
          const isLast = i === TABS.length - 1;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-5 py-2.5 border text-sm font-semibold transition-colors',
                isFirst ? 'rounded-l-lg' : '',
                isLast ? 'rounded-r-lg' : '',
                active
                  ? 'bg-advent-navy text-white border-advent-navy'
                  : 'bg-white text-advent-gray-500 border-advent-gray-200 hover:bg-advent-gray-75',
              ].join(' ')}
            >
              {tab.label}
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
