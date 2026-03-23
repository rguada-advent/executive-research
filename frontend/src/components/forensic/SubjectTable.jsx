import { useApp } from '../../context/AppContext';
import { RiskBadge, StatusDot } from '../shared/Badge';
import { FORENSIC_PIPELINE_STAGES } from '../../utils/constants';

export default function SubjectTable({ onInvestigate, onView }) {
  const { state } = useApp();
  const { leaders, pipeline, researching } = state;

  if (!leaders.length) {
    return (
      <div className="text-center py-12 text-advent-gray-500">
        <p>No subjects added.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-advent-gray-75">
            <th className="text-left px-3.5 py-2.5 text-[11px] uppercase tracking-wide text-advent-gray-500 border-b-2 border-advent-gray-200">Name</th>
            <th className="text-left px-3.5 py-2.5 text-[11px] uppercase tracking-wide text-advent-gray-500 border-b-2 border-advent-gray-200">Title</th>
            <th className="text-left px-3.5 py-2.5 text-[11px] uppercase tracking-wide text-advent-gray-500 border-b-2 border-advent-gray-200">Company</th>
            <th className="text-left px-3.5 py-2.5 text-[11px] uppercase tracking-wide text-advent-gray-500 border-b-2 border-advent-gray-200">Status</th>
            <th className="text-left px-3.5 py-2.5 text-[11px] uppercase tracking-wide text-advent-gray-500 border-b-2 border-advent-gray-200">Risk</th>
            <th className="text-left px-3.5 py-2.5 text-[11px] uppercase tracking-wide text-advent-gray-500 border-b-2 border-advent-gray-200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((l, idx) => {
            const pipe = pipeline[l.name];
            const hasBrief = !!pipe?.brief;
            const isActive = researching === l.name;
            const risk = pipe?.overallRisk || 'none';
            const completed = pipe ? pipe.completedAgents.length : 0;
            const total = FORENSIC_PIPELINE_STAGES.length;

            const statusText = hasBrief ? 'Complete' : isActive ? 'Investigating...' : 'Pending';
            const dotStatus = hasBrief ? 'complete' : isActive ? 'active' : 'pending';

            return (
              <tr key={idx} className="hover:bg-advent-gray-75 border-b border-advent-gray-200">
                <td className="px-3.5 py-2.5 text-sm align-middle">
                  {hasBrief ? (
                    <button
                      onClick={() => onView(idx)}
                      className="text-advent-navy font-semibold hover:underline"
                    >
                      {l.name}
                    </button>
                  ) : (
                    <span className="font-medium text-advent-gray-700">{l.name}</span>
                  )}
                </td>
                <td className="px-3.5 py-2.5 text-sm align-middle text-advent-gray-700">{l.title}</td>
                <td className="px-3.5 py-2.5 text-sm align-middle text-advent-gray-500">{l.company || ''}</td>
                <td className="px-3.5 py-2.5 text-sm align-middle">
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={dotStatus} />
                    <span className="text-advent-gray-700">{statusText}</span>
                    {pipe && (
                      <div className="inline-flex gap-0.5 items-center ml-1" title={`${completed}/${total} agents`}>
                        {FORENSIC_PIPELINE_STAGES.map(s => {
                          let bg = 'bg-advent-gray-350';
                          if (pipe.completedAgents.includes(s.agent)) bg = 'bg-risk-none';
                          else if (pipe.failedAgents.includes(s.agent)) bg = 'bg-risk-high';
                          else if (isActive) bg = 'bg-risk-medium';
                          return <span key={s.id} className={`w-1.5 h-1.5 rounded-full ${bg}`} />;
                        })}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3.5 py-2.5 text-sm align-middle">
                  <RiskBadge risk={risk} />
                </td>
                <td className="px-3.5 py-2.5 text-sm align-middle">
                  {isActive ? (
                    <span className="w-4 h-4 border-2 border-advent-gray-350 border-t-advent-navy rounded-full animate-spin inline-block" />
                  ) : hasBrief ? (
                    <button
                      onClick={() => onView(idx)}
                      className="bg-advent-gray-200 border border-advent-gray-350 text-advent-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-advent-gray-350"
                    >
                      View
                    </button>
                  ) : (
                    <button
                      onClick={() => onInvestigate(idx)}
                      className="bg-advent-navy text-white px-3 py-1 rounded text-xs font-semibold hover:opacity-90"
                    >
                      Investigate
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
