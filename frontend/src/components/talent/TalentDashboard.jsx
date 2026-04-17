import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import CandidateTable from './CandidateTable';
import { SENIORITY_OPTIONS } from '../../utils/constants';

export default function TalentDashboard({ onViewBrief, onResearchOne, onResearchAll, onStopAll, onBackToInput }) {
  const { state } = useApp();
  const { leaders, researching, specAnalysis } = state;
  const [seniorityFilter, setSeniorityFilter] = useState('all');

  const filteredCount = seniorityFilter === 'all'
    ? leaders.length
    : leaders.filter(l => l.seniority === seniorityFilter).length;

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-6">
      <h2 className="text-base font-bold text-advent-navy flex items-center gap-2 mb-4">
        <span className="w-1 h-[18px] bg-advent-blue rounded" />
        Management Pipeline
      </h2>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={seniorityFilter}
          onChange={e => setSeniorityFilter(e.target.value)}
          className="border border-advent-gray-350 rounded px-3 py-1.5 text-sm bg-white"
        >
          {SENIORITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {!researching ? (
          <button
            onClick={onResearchAll}
            disabled={leaders.length === 0}
            className="bg-advent-blue text-white px-3 py-1.5 rounded text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Research All
          </button>
        ) : (
          <button
            onClick={onStopAll}
            className="bg-red-600 text-white px-3 py-1.5 rounded text-sm font-semibold hover:opacity-90"
          >
            Stop All
          </button>
        )}

        <button
          onClick={onBackToInput}
          className="bg-white border border-advent-gray-350 text-advent-gray-700 px-3 py-1.5 rounded text-sm font-semibold hover:bg-advent-gray-100"
        >
          ← Add Executives
        </button>

        {specAnalysis && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-risk-none/10 text-risk-none rounded-full text-xs font-semibold">
            ✓ Criteria Loaded — Spec Mirror Enabled
          </span>
        )}

        <span className="ml-auto text-sm text-advent-gray-500">
          {filteredCount} candidate{filteredCount !== 1 ? 's' : ''}
          {seniorityFilter !== 'all' ? ` (${seniorityFilter})` : ''}
        </span>
      </div>

      <CandidateTable
        onViewBrief={onViewBrief}
        onResearch={onResearchOne}
        seniorityFilter={seniorityFilter}
        onSeniorityChange={setSeniorityFilter}
      />
    </div>
  );
}
