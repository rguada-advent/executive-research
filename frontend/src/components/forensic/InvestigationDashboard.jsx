import { useApp } from '../../context/AppContext';
import SubjectTable from './SubjectTable';

export default function InvestigationDashboard({ onInvestigate, onView, onInvestigateAll, onStopAll, onAddMore }) {
  const { state } = useApp();
  const { leaders, researching } = state;

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-6 mb-4">
      <h2 className="text-base font-bold text-advent-navy flex items-center gap-2 mb-4">
        <span className="w-1 h-[18px] bg-advent-navy rounded" />
        Investigation Dashboard
      </h2>

      <div className="flex flex-wrap gap-2 items-center mb-4">
        <button
          onClick={onInvestigateAll}
          disabled={!!researching}
          className="bg-advent-navy text-white px-4 py-1.5 rounded text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          Investigate All
        </button>
        {researching && (
          <button
            onClick={onStopAll}
            className="bg-risk-high text-white px-4 py-1.5 rounded text-sm font-semibold hover:opacity-90"
          >
            Stop All
          </button>
        )}
        <button
          onClick={onAddMore}
          className="bg-advent-gray-200 border border-advent-gray-350 text-advent-gray-700 px-4 py-1.5 rounded text-sm font-medium hover:bg-advent-gray-350"
        >
          &larr; Add More Subjects
        </button>
        <span className="text-sm text-advent-gray-500 ml-auto">
          {leaders.length} subject{leaders.length !== 1 ? 's' : ''}
        </span>
      </div>

      <SubjectTable onInvestigate={onInvestigate} onView={onView} />
    </div>
  );
}
