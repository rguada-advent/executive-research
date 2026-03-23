export default function PipelineTracker({ stages, pipeline, name }) {
  if (!pipeline || !name || !pipeline[name]) return null;
  const pipe = pipeline[name];
  const completed = pipe.completedAgents?.length || 0;
  const failed = pipe.failedAgents?.length || 0;
  const total = stages.length;
  const parallelIds = ['contact', 'social', 'glassdoor', 'linkedin', 'legal', 'regulatory'];

  return (
    <div className="bg-white border border-advent-gray-200 rounded-xl p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold text-advent-navy">Investigation Pipeline</span>
        <span className="text-xs text-advent-gray-500">
          {completed}/{total} agents{failed ? ` · ${failed} failed` : ''}
          {pipe.overallConfidence != null ? ` · Confidence: ${(pipe.overallConfidence * 100).toFixed(0)}%` : ''}
          {pipe.overallRisk !== 'none' ? ` · Risk: ${pipe.overallRisk.toUpperCase()}` : ''}
        </span>
      </div>
      <div className="flex items-center gap-0 overflow-x-auto py-1">
        {stages.map((stage, i) => {
          let cls = 'bg-advent-gray-200 text-advent-gray-500';
          let detail = '';
          if (pipe.completedAgents?.includes(stage.agent)) { cls = 'bg-risk-none text-white'; detail = '\u2713'; }
          else if (pipe.failedAgents?.includes(stage.agent)) { cls = 'bg-risk-high text-white'; detail = '\u2717'; }
          else if (pipe.state === stage.id || (pipe.state === 'contact' && parallelIds.includes(stage.id))) { cls = 'bg-risk-medium text-white animate-pulse'; }

          return (
            <div key={stage.id} className="flex flex-col items-center min-w-[72px] relative">
              {i > 0 && <div className={`absolute top-4 right-1/2 w-full h-0.5 ${pipe.completedAgents?.includes(stages[i-1].agent) ? 'bg-risk-none' : 'bg-advent-gray-200'}`} />}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 ${cls}`}>
                {detail || stage.agent}
              </div>
              <span className="text-[11px] mt-1 text-advent-gray-500">{stage.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
