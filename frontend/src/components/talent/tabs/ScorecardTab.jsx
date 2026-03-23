import { useState } from 'react';
import { useApp } from '../../../context/AppContext';

function ScoreCircle({ score, label }) {
  const cls =
    score >= 4 ? 'bg-green-50 text-green-700 border-green-300' :
    score >= 3 ? 'bg-amber-50 text-amber-700 border-amber-300' :
                 'bg-red-50 text-red-700 border-red-300';
  return (
    <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-[3px] shrink-0 cursor-pointer hover:scale-105 transition-transform ${cls}`}>
      <span className="text-4xl font-extrabold leading-none">{score ? score.toFixed(1) : '—'}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide mt-0.5">{label}</span>
    </div>
  );
}

function ConfidenceBadge({ level }) {
  const map = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${map[level] || map.low}`}>
      {level || 'low'}
    </span>
  );
}

function CriterionRow({ criterion, leaderName, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editScore, setEditScore] = useState(criterion.score || 3);
  const [editNotes, setEditNotes] = useState(criterion.adjustmentNotes || '');

  const score = criterion.adjustedScore ?? criterion.score ?? 0;
  const isAdjusted = criterion.adjustedScore != null;
  const barPct = Math.round((score / 5) * 100);
  const barCls =
    score >= 4 ? 'bg-green-500' :
    score >= 3 ? 'bg-amber-500' :
                 'bg-red-500';

  function handleSave() {
    const s = Math.min(5, Math.max(1, Number(editScore)));
    onUpdate({ ...criterion, adjustedScore: s, adjustmentNotes: editNotes });
    setEditing(false);
  }

  return (
    <div className={`rounded-lg overflow-hidden ${isAdjusted ? 'bg-amber-50' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <span className="w-48 shrink-0 font-semibold text-sm text-gray-700">
          {criterion.name}
          {isAdjusted && (
            <span className="ml-1.5 inline-block px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded">
              Adjusted
            </span>
          )}
        </span>
        <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barCls}`} style={{ width: `${barPct}%` }} />
        </div>
        <span className="w-12 text-right font-bold text-sm text-gray-700">{score}/5</span>
        <ConfidenceBadge level={criterion.evidenceConfidence} />
        <button
          onClick={() => setEditing(!editing)}
          className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:border-advent-blue hover:text-advent-blue hover:bg-cyan-50 text-sm transition-colors shrink-0"
          title="Edit score"
        >
          ✎
        </button>
      </div>
      {criterion.rationale && (
        <p className="px-3.5 pb-2 text-xs text-gray-500 leading-relaxed">{criterion.rationale}</p>
      )}
      {editing && (
        <div className="px-3.5 pb-3 bg-cyan-50 border-t border-cyan-200">
          <p className="text-xs font-semibold text-gray-600 mt-2 mb-1">Adjust Score (1-5)</p>
          <input
            type="number"
            min={1} max={5}
            value={editScore}
            onChange={e => setEditScore(e.target.value)}
            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900"
          />
          <p className="text-xs font-semibold text-gray-600 mt-2 mb-1">Notes (optional)</p>
          <textarea
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm resize-y text-gray-900"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleSave} className="bg-advent-blue text-white px-3 py-1 rounded text-xs font-semibold">Save</button>
            <button onClick={() => setEditing(false)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-semibold">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScorecardTab({ scoring, leaderName, onRunScore, specLoaded }) {
  const { dispatch } = useApp();
  const [overriding, setOverriding] = useState(false);
  const [overrideVal, setOverrideVal] = useState('');

  if (!scoring) {
    return (
      <div className="bg-white rounded-xl border border-advent-gray-200 p-10 text-center">
        {specLoaded ? (
          <>
            <p className="text-base text-advent-gray-500 mb-3">No fit assessment yet.</p>
            <button onClick={onRunScore} className="bg-risk-medium text-white px-5 py-2 rounded text-sm font-semibold hover:opacity-90">
              Score Candidate Fit
            </button>
          </>
        ) : (
          <>
            <p className="text-base text-advent-gray-500 mb-1">Fit scoring requires a recruiting specification.</p>
            <p className="text-sm text-advent-gray-400">Load a spec in the input view to enable scoring.</p>
          </>
        )}
      </div>
    );
  }

  const overallScore = scoring.overriddenScore ?? scoring.overallScore ?? 0;
  const scoreLabel = overallScore >= 4 ? 'Strong Fit' : overallScore >= 3 ? 'Moderate Fit' : 'Weak Fit';

  function handleCriterionUpdate(idx, updated) {
    const newCriteria = [...(scoring.criteria || [])];
    newCriteria[idx] = updated;
    dispatch({
      type: 'UPDATE_PIPELINE',
      payload: { name: leaderName, data: { scoring: { ...scoring, criteria: newCriteria } } },
    });
  }

  function handleOverride() {
    const v = Math.min(5, Math.max(1, Number(overrideVal)));
    dispatch({
      type: 'UPDATE_PIPELINE',
      payload: { name: leaderName, data: { scoring: { ...scoring, overriddenScore: v } } },
    });
    setOverriding(false);
  }

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-8 text-gray-800">
      {/* Score Hero */}
      <div className="flex items-center gap-6 mb-8 pb-6 border-b-2 border-gray-100">
        <ScoreCircle score={overallScore} label={overallScore >= 4 ? 'Strong' : overallScore >= 3 ? 'Moderate' : 'Weak'} />
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{scoreLabel}</h2>
          <p className="text-sm text-gray-500">
            Overall fit score: {overallScore.toFixed(1)} / 5.0
            {scoring.overriddenScore != null && (
              <span className="ml-2 text-amber-600 font-semibold">(Manually overridden)</span>
            )}
          </p>
          {scoring.dataQualityWarning && (
            <p className="text-xs text-amber-600 mt-1 font-medium">⚠ {scoring.dataQualityWarning}</p>
          )}
        </div>
        <button
          onClick={() => setOverriding(!overriding)}
          className="ml-auto text-xs border border-gray-300 text-gray-500 px-3 py-1.5 rounded hover:border-advent-blue hover:text-advent-blue"
        >
          Override Score
        </button>
      </div>

      {overriding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">Override Overall Score (1-5)</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1} max={5} step={0.1}
              value={overrideVal}
              onChange={e => setOverrideVal(e.target.value)}
              placeholder={overallScore}
              className="w-24 border border-gray-300 rounded px-3 py-1.5 text-sm"
            />
            <button onClick={handleOverride} className="bg-advent-blue text-white px-4 py-1.5 rounded text-sm font-semibold">Apply</button>
            <button onClick={() => setOverriding(false)} className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm font-semibold">Cancel</button>
          </div>
          <p className="text-xs text-amber-600 mt-1.5 font-semibold">Override note will be flagged in the assessment.</p>
        </div>
      )}

      {/* Criteria Grid */}
      {scoring.criteria?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-advent-blue mb-3 pb-1 border-b border-gray-200">Evaluation Criteria</h3>
          <div className="space-y-2">
            {scoring.criteria.map((c, i) => (
              <CriterionRow
                key={i}
                criterion={c}
                leaderName={leaderName}
                onUpdate={(updated) => handleCriterionUpdate(i, updated)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {scoring.strengths?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-green-700 mb-2 pb-1 border-b border-gray-200">Strengths</h3>
          <ul className="ml-5 list-disc space-y-1">
            {scoring.strengths.map((s, i) => (
              <li key={i} className="text-sm text-gray-700">{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {scoring.gaps?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-red-600 mb-2 pb-1 border-b border-gray-200">Gaps / Concerns</h3>
          <ul className="ml-5 list-disc space-y-1">
            {scoring.gaps.map((g, i) => (
              <li key={i} className="text-sm text-gray-700">{g}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation */}
      {scoring.recommendation && (
        <div>
          <h3 className="text-sm font-bold text-advent-blue mb-2 pb-1 border-b border-gray-200">Recommendation</h3>
          <p className="text-sm text-gray-700">{scoring.recommendation}</p>
        </div>
      )}
    </div>
  );
}
