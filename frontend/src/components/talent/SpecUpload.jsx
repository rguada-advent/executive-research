import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function SpecUpload() {
  const { state, dispatch, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [specText, setSpecText] = useState(state.specText || '');
  const [calibration, setCalibration] = useState(state.calibrationCtx || '');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    if (!specText.trim()) { toast('Please paste a recruiting specification first.'); return; }
    if (!state.apiKey) { toast('Please configure your API key in the header.'); return; }
    dispatch({ type: 'SET_SPEC', payload: specText });
    dispatch({ type: 'SET_CALIBRATION', payload: calibration });
    setLoading(true);
    setStatus('Analyzing spec...');
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': state.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      };
      const prompt = `You are an expert recruiting specification analyst. Deconstruct this job description into structured requirements.

${calibration ? 'SENIORITY CALIBRATION:\n' + calibration + '\n\n' : ''}=== RECRUITING SPECIFICATION ===
${specText.slice(0, 30000)}

Return ONLY valid JSON:
{"roleSummary":"...","mustHave":[{"requirement":"...","category":"leadership|industry|functional|education|geographic|compensation"}],"niceToHave":[{"requirement":"...","category":"..."}],"redFlags":["..."],"industryContext":["..."],"targetCompanies":["..."],"keyQuestionAreas":["..."],"evaluationWeights":{"leadership":1.0,"industry":1.0,"functional":1.0,"education":0.5,"trackRecord":1.0,"culture":0.8,"governance":0.5,"network":0.6,"geographic":0.3,"compensation":0.7}}`;
      const body = {
        model: state.model,
        max_tokens: 4096,
        system: 'You are an executive recruiting specialist.',
        messages: [{ role: 'user', content: prompt }],
      };
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers, body: JSON.stringify(body),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || `API error ${r.status}`); }
      const data = await r.json();
      const text = data.content.filter(c => c.type === 'text').map(c => c.text).join('');
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse spec analysis.');
      const analysis = JSON.parse(match[0]);
      dispatch({ type: 'SET_SPEC_ANALYSIS', payload: analysis });
      setStatus('Spec analyzed successfully.');
      toast('Recruiting spec analyzed. Fit scoring enabled.');
    } catch (err) {
      setStatus('Error: ' + err.message);
      toast('Spec analysis failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const analysis = state.specAnalysis;

  return (
    <div className="bg-white rounded-xl border border-risk-medium/40 p-6 mb-4">
      <h2
        className="text-base font-bold text-advent-navy flex items-center gap-2 cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <span className="w-1 h-[18px] bg-risk-medium rounded" />
        Recruiting Specification (Optional)
        {analysis ? (
          <span className="ml-2 inline-flex items-center gap-1.5 px-3 py-0.5 bg-risk-none/10 text-risk-none rounded-full text-xs font-semibold">
            ✓ Spec Loaded
          </span>
        ) : (
          <span className="ml-2 inline-flex items-center gap-1.5 px-3 py-0.5 bg-risk-medium/10 text-risk-medium rounded-full text-xs font-semibold">
            Not loaded
          </span>
        )}
        <span className="ml-auto text-xs text-advent-gray-500">{open ? '▾' : '▸'}</span>
      </h2>

      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-advent-gray-500">
            Paste the job description to enable AI-powered fit scoring and tailored screening questions.
          </p>

          <div>
            <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">Recruiting Specification</label>
            <textarea
              value={specText}
              onChange={e => setSpecText(e.target.value)}
              placeholder="Paste the full job description, required qualifications, responsibilities..."
              className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm resize-y"
              style={{ minHeight: '120px' }}
            />
          </div>

          <div>
            <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">Seniority & Title Calibration (Optional)</label>
            <textarea
              value={calibration}
              onChange={e => setCalibration(e.target.value)}
              placeholder={`e.g. "A Director at a PE fund like Blackstone is equivalent to a C-Suite role at a mid-market operating company."`}
              rows={3}
              className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm resize-y"
            />
            <p className="text-xs text-advent-gray-500 italic mt-1">
              Explain how titles at the candidate's organization should be interpreted relative to the target role.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-risk-medium text-white px-4 py-1.5 rounded text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Analyze Spec
            </button>
            {status && <span className="text-sm text-advent-gray-500">{status}</span>}
          </div>

          {analysis && (
            <div className="mt-4 border-t border-advent-gray-200 pt-4 space-y-3">
              {analysis.roleSummary && (
                <div>
                  <p className="text-xs font-semibold text-advent-gray-500 uppercase tracking-wide mb-1">Role Summary</p>
                  <p className="text-sm text-advent-gray-700">{analysis.roleSummary}</p>
                </div>
              )}
              {analysis.mustHave?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-advent-gray-500 uppercase tracking-wide mb-2">Must-Haves</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.mustHave.map((m, i) => (
                      <span key={i} className="inline-block px-2.5 py-1 bg-risk-none/10 text-risk-none text-xs font-medium rounded-full">
                        {m.requirement}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {analysis.niceToHave?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-advent-gray-500 uppercase tracking-wide mb-2">Nice-to-Haves</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.niceToHave.map((n, i) => (
                      <span key={i} className="inline-block px-2.5 py-1 bg-advent-blue/10 text-advent-blue text-xs font-medium rounded-full">
                        {n.requirement}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
