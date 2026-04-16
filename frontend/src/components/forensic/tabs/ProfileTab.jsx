import MarkdownRenderer from '../../shared/MarkdownRenderer';

export default function ProfileTab({ brief, pipe }) {
  // Empty brief but pipeline ran → brief generation failed silently
  const pipelineRan = pipe && (pipe.completedAgents?.length > 0 || pipe.failedAgents?.length > 0);
  if (!brief) {
    if (pipelineRan) {
      return (
        <div className="psg-card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3 className="text-base font-semibold text-advent-navy mb-1">Report couldn't be generated</h3>
          <p className="text-sm text-advent-gray-500 max-w-md mx-auto leading-relaxed">
            The brief synthesizer returned empty content. This usually means the Anthropic API hit a rate limit during the run. Wait about a minute and click <span className="font-semibold text-advent-navy">Investigate</span> again — individual module tabs (Social, Legal, etc.) may still have useful data.
          </p>
        </div>
      );
    }
    return (
      <div className="psg-card p-8 text-center text-advent-gray-500">
        <p>No report yet. Investigate this person first.</p>
      </div>
    );
  }

  return (
    <div className="psg-card p-8">
      <MarkdownRenderer content={brief} />
    </div>
  );
}
