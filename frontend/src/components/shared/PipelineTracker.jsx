export default function PipelineTracker({ stages, pipeline, name }) {
  if (!pipeline || !name || !pipeline[name]) return null;
  const pipe = pipeline[name];
  const completed = pipe.completedAgents?.length || 0;
  const failed = pipe.failedAgents?.length || 0;
  const total = stages.length;
  const parallelIds = ['contact', 'social', 'glassdoor', 'linkedin', 'legal', 'regulatory'];
  const progressPct = Math.min(100, Math.round((completed / total) * 100));

  return (
    <div className="psg-card p-5 mb-4 pipeline-tracker">
      <div className="flex justify-between items-baseline mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-advent-gray-500">Pipeline</span>
          <span className="text-sm font-bold text-advent-navy">
            {completed} of {total}
          </span>
          {failed > 0 && (
            <span className="text-[11px] font-semibold text-red-600">· {failed} failed</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-advent-gray-500">
          {pipe.overallConfidence != null && (
            <span>Confidence <span className="font-semibold text-advent-navy">{(pipe.overallConfidence * 100).toFixed(0)}%</span></span>
          )}
          {pipe.overallRisk && pipe.overallRisk !== 'none' && (
            <span className="psg-chip bg-amber-50 text-amber-700 border-amber-100">
              Risk · {pipe.overallRisk}
            </span>
          )}
        </div>
      </div>

      {/* Progress line */}
      <div className="relative mb-3">
        <div className="absolute left-0 right-0 top-4 h-px bg-[var(--border-subtle)]" aria-hidden />
        <div
          className="absolute left-0 top-4 h-px bg-advent-navy transition-all duration-500"
          style={{ width: `${progressPct}%` }}
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-1 overflow-x-auto pb-1">
          {stages.map((stage) => {
            const isDone = pipe.completedAgents?.includes(stage.agent);
            const isFailed = pipe.failedAgents?.includes(stage.agent);
            const isActive = pipe.state === stage.id || (pipe.state === 'contact' && parallelIds.includes(stage.id));

            let dotClasses = 'bg-white border border-[var(--border-default)] text-advent-gray-500';
            let content = stage.agent;

            if (isDone) {
              dotClasses = 'bg-advent-navy text-white border border-advent-navy shadow-sm';
              content = (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              );
            } else if (isFailed) {
              dotClasses = 'bg-red-50 text-red-600 border border-red-200';
              content = (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              );
            } else if (isActive) {
              dotClasses = 'bg-advent-blue text-white border border-advent-blue psg-pulse';
            }

            return (
              <div key={stage.id} className="flex flex-col items-center min-w-[70px] shrink-0">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200 ${dotClasses}`}>
                  {content}
                </div>
                <span className={`mt-2 text-[10px] font-medium text-center leading-tight ${isDone ? 'text-advent-navy' : isFailed ? 'text-red-600' : 'text-advent-gray-500'}`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
