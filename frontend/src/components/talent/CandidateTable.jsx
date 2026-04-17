import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SeniorityBadge, StatusDot } from '../shared/Badge';


function MiniPipeline({ pipeEntry }) {
  if (!pipeEntry) return null;
  const dots = ['professional', 'contact', 'brief', 'observations', 'questions'];
  return (
    <span className="inline-flex gap-0.5 items-center">
      {dots.map(key => {
        const done = pipeEntry[key] != null;
        const active = pipeEntry.state === key;
        const cls = done ? 'bg-risk-none' : active ? 'bg-risk-medium animate-pulse' : 'bg-advent-gray-350';
        return <span key={key} className={`w-1.5 h-1.5 rounded-full ${cls}`} />;
      })}
    </span>
  );
}

export default function CandidateTable({ onViewBrief, onResearch, seniorityFilter, onSeniorityChange }) {
  const { state, dispatch } = useApp();
  const { leaders, pipeline, specAnalysis } = state;

  const filtered = seniorityFilter && seniorityFilter !== 'all'
    ? leaders.filter(l => l.seniority === seniorityFilter)
    : leaders;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-advent-gray-400">
        <p className="text-lg mb-1">No executives yet</p>
        <p className="text-sm">Use discovery or import to add executives.</p>
      </div>
    );
  }

  function getStatus(leader) {
    const pipe = pipeline[leader.name];
    if (!pipe) return { status: 'pending', label: 'Not researched' };
    if (pipe.state === 'done' || pipe.brief) return { status: 'complete', label: 'Complete' };
    if (pipe.state === 'starting' || pipe.state === 'professional') return { status: 'active', label: 'Researching...' };
    if (pipe.state === 'failed') return { status: 'error', label: 'Failed' };
    return { status: 'active', label: pipe.state || 'In progress' };
  }

  function hasObservations(leader) {
    return pipeline[leader.name]?.observations != null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-advent-gray-100">
            <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b-2 border-advent-gray-200">Name</th>
            <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b-2 border-advent-gray-200">Title</th>
            <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b-2 border-advent-gray-200">Seniority</th>
            <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b-2 border-advent-gray-200">Source</th>
            <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b-2 border-advent-gray-200">Status</th>
            {specAnalysis && (
              <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b-2 border-advent-gray-200">Mirror</th>
            )}
            <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b-2 border-advent-gray-200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((leader, idx) => {
            const pipe = pipeline[leader.name];
            const { status, label } = getStatus(leader);
            const hasBrief = pipe?.brief != null;

            return (
              <tr key={idx} className="border-b border-advent-gray-100 hover:bg-advent-gray-50">
                <td className="px-3 py-2.5 text-sm">
                  {hasBrief ? (
                    <button
                      onClick={() => onViewBrief && onViewBrief(leader)}
                      className="text-advent-blue font-semibold hover:underline"
                    >
                      {leader.name}
                    </button>
                  ) : (
                    <span className="font-medium text-advent-gray-700">{leader.name}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-sm text-advent-gray-600">{leader.title || '—'}</td>
                <td className="px-3 py-2.5">
                  <SeniorityBadge seniority={leader.seniority || 'other'} />
                </td>
                <td className="px-3 py-2.5 text-xs text-advent-gray-500">{leader.source || 'Manual'}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={status} />
                    <span className="text-xs text-advent-gray-600">{label}</span>
                    <MiniPipeline pipeEntry={pipe} />
                  </div>
                </td>
                {specAnalysis && (
                  <td className="px-3 py-2.5">
                    {hasObservations(leader)
                      ? <span className="text-xs font-semibold text-advent-blue">✓ Ready</span>
                      : <span className="text-xs text-advent-gray-400">—</span>
                    }
                  </td>
                )}
                <td className="px-3 py-2.5">
                  <div className="flex gap-1 flex-wrap">
                    {!hasBrief && (
                      <button
                        onClick={() => onResearch && onResearch(leader)}
                        className="bg-advent-blue text-white px-2.5 py-1 rounded text-xs font-semibold hover:opacity-90"
                      >
                        Research
                      </button>
                    )}
                    {hasBrief && (
                      <button
                        onClick={() => onViewBrief && onViewBrief(leader)}
                        className="bg-white border border-advent-blue text-advent-blue px-2.5 py-1 rounded text-xs font-semibold hover:bg-advent-blue/5"
                      >
                        View
                      </button>
                    )}
                    {specAnalysis && hasBrief && !hasObservations(leader) && (
                      <button
                        onClick={() => onViewBrief && onViewBrief(leader, 'mirror')}
                        className="bg-advent-blue text-white px-2.5 py-1 rounded text-xs font-semibold hover:opacity-90"
                      >
                        Mirror
                      </button>
                    )}
                    {specAnalysis && hasBrief && (
                      <button
                        onClick={() => onViewBrief && onViewBrief(leader, 'questions')}
                        className="bg-risk-none text-white px-2.5 py-1 rounded text-xs font-semibold hover:opacity-90"
                      >
                        Guide
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const realIdx = leaders.indexOf(leader);
                        if (realIdx !== -1) dispatch({ type: 'REMOVE_LEADER', payload: realIdx });
                      }}
                      className="text-advent-gray-400 hover:text-red-500 px-1.5 py-1 text-xs"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
