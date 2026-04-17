import { useState } from 'react';
import { useApp } from '../../../context/AppContext';

function TierBadge({ tier }) {
  return tier === 'must'
    ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-advent-navy text-white">Must-Have</span>
    : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-advent-blue/10 text-advent-blue border border-advent-blue/20">Nice-to-Have</span>;
}

function CategoryPill({ category }) {
  const labels = {
    leadership: 'Leadership', industry: 'Industry', functional: 'Functional',
    education: 'Education', geographic: 'Geographic', compensation: 'Compensation',
  };
  return (
    <span className="text-[10px] font-semibold text-advent-gray-500 uppercase tracking-wider">
      {labels[category] || category}
    </span>
  );
}

function MirrorRow({ req, obs, isLast, loading }) {
  const tierIcon = req.tier === 'must' ? '✦' : '◇';

  return (
    <div className={`flex items-stretch ${!isLast ? 'border-b border-advent-gray-200' : ''}`}>
      {/* LEFT: Requirement */}
      <div className="w-5/12 shrink-0 px-5 py-4 bg-advent-gray-75">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-advent-navy font-bold text-sm shrink-0">{tierIcon}</span>
          <TierBadge tier={req.tier} />
          <CategoryPill category={req.category} />
        </div>
        <p className="text-sm font-medium text-advent-navy leading-snug">{req.requirement}</p>
      </div>

      {/* DIVIDER — the gap is the product */}
      <div className="w-px shrink-0 bg-gradient-to-b from-advent-gold/0 via-advent-gold/50 to-advent-gold/0" />

      {/* RIGHT: Observations */}
      <div className="flex-1 px-5 py-4 bg-white">
        {loading || !obs ? (
          <div className="space-y-2 pt-1">
            <div className="psg-skeleton h-3 w-4/5 rounded" />
            <div className="psg-skeleton h-3 w-3/5 rounded" />
            <div className="psg-skeleton h-3 w-2/5 rounded" />
          </div>
        ) : (
          <>
            {obs.observed?.length > 0 && (
              <ul className="space-y-1.5 mb-2">
                {obs.observed.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-advent-gray-700 leading-relaxed">
                    <span className="mt-[7px] w-1 h-1 rounded-full bg-advent-blue shrink-0" />
                    {o}
                  </li>
                ))}
              </ul>
            )}
            {obs.notObserved && (
              <p className="text-sm text-advent-gray-400 italic">{obs.notObserved}</p>
            )}
            {obs.sourceHints?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {obs.sourceHints.map((s, i) => (
                  <span key={i} className="text-[10px] font-semibold px-1.5 py-0.5 bg-advent-gray-100 text-advent-gray-500 rounded">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FlagRow({ flag, type }) {
  const isLegal = type === 'legal';
  const wrapCls = isLegal
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-purple-50 border-purple-200 text-purple-800';
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${wrapCls}`}>
      <span className="shrink-0 mt-0.5 font-bold text-base leading-none">⚑</span>
      <div className="min-w-0">
        <p className="font-semibold">{flag.type || flag.agency}{flag.date ? ` · ${flag.date}` : ''}</p>
        <p className="leading-relaxed mt-0.5 break-words">{flag.description}</p>
        {flag.status && <p className="text-xs mt-1 opacity-75">Status: {flag.status}</p>}
        {flag.source && <p className="text-xs mt-0.5 opacity-60">Source: {flag.source}</p>}
      </div>
    </div>
  );
}

function CertificationGate({ onCertify }) {
  const [dealName, setDealName] = useState('');
  const [analystName, setAnalystName] = useState('');
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="psg-card p-8 max-w-xl mx-auto mt-6 psg-fade-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-advent-navy flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-advent-navy text-[15px] tracking-tight">DD Purpose Certification</h3>
          <p className="text-xs text-advent-gray-500 mt-0.5">Required before accessing Spec Mirror analysis</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="psg-label">
            Deal / Project Name
            <span className="ml-1 text-advent-gray-350 normal-case font-normal tracking-normal">(recommended)</span>
          </label>
          <input
            type="text"
            value={dealName}
            onChange={e => setDealName(e.target.value)}
            placeholder="e.g. Project Falcon"
            className="psg-input"
          />
        </div>
        <div>
          <label className="psg-label">
            Analyst Name
            <span className="ml-1 text-advent-gray-350 normal-case font-normal tracking-normal">(recommended)</span>
          </label>
          <input
            type="text"
            value={analystName}
            onChange={e => setAnalystName(e.target.value)}
            placeholder="Your name"
            className="psg-input"
          />
        </div>

        <button
          type="button"
          onClick={() => setAccepted(a => !a)}
          className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors duration-150 ${
            accepted
              ? 'bg-advent-navy/5 border-advent-navy/25'
              : 'bg-advent-gray-75 border-advent-gray-200 hover:border-advent-gray-350'
          }`}
        >
          <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
            accepted ? 'bg-advent-navy border-advent-navy' : 'border-advent-gray-350 bg-white'
          }`}>
            {accepted && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p className="text-sm text-advent-gray-700 leading-relaxed select-none">
            I certify that this research is being conducted for{' '}
            <strong className="text-advent-navy">investment due diligence purposes</strong> — to evaluate
            management quality as a factor in an investment decision — and{' '}
            <strong className="text-advent-navy">not</strong> for the purpose of evaluating this individual
            for employment, promotion, reassignment, or retention.
          </p>
        </button>
      </div>

      <button
        onClick={() => {
          if (!accepted) return;
          onCertify({
            dealName: dealName.trim(),
            analystName: analystName.trim(),
            timestamp: new Date().toISOString(),
            purpose: 'investment-due-diligence',
          });
        }}
        disabled={!accepted}
        className="psg-btn psg-btn-primary w-full py-3 text-[14px]"
      >
        Begin DD Analysis
      </button>
      {!accepted && (
        <p className="text-xs text-center text-advent-gray-400 mt-2.5">Certification required to proceed</p>
      )}
    </div>
  );
}

export default function SpecMirrorTab({ observations, leaderName, specAnalysis, specLoaded, onRunObserver, loading }) {
  const { state, dispatch } = useApp();
  const [analystNotes, setAnalystNotes] = useState('');

  const pipe = state.pipeline[leaderName] || {};
  const ddCertified = pipe.ddCertified;

  function handleCertify(certData) {
    dispatch({
      type: 'UPDATE_PIPELINE',
      payload: { name: leaderName, data: { ddCertified: certData } },
    });
    if (pipe.brief) {
      onRunObserver();
    }
  }

  // No spec loaded
  if (!specLoaded || !specAnalysis) {
    return (
      <div className="psg-card p-10 text-center psg-fade-up">
        <div className="w-14 h-14 rounded-full bg-advent-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-advent-gray-350">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <p className="text-base font-semibold text-advent-navy mb-1">Management Criteria Required</p>
        <p className="text-sm text-advent-gray-500 max-w-xs mx-auto leading-relaxed">
          Load management assessment criteria in the input view to enable the Spec Mirror.
        </p>
      </div>
    );
  }

  // Not certified — show gate
  if (!ddCertified) {
    return <CertificationGate onCertify={handleCertify} />;
  }

  // Build requirement list
  const mustHave = (specAnalysis.mustHave || []).map((r, i) => ({ ...r, id: i, tier: 'must' }));
  const niceToHave = (specAnalysis.niceToHave || []).slice(0, 6).map((r, i) => ({ ...r, id: i + 100, tier: 'nice' }));
  const allRequirements = [...mustHave, ...niceToHave];

  // Map observations by requirementId
  const obsMap = {};
  if (observations?.observations) {
    observations.observations.forEach(o => { obsMap[o.requirementId] = o; });
  }

  const legalFlags = observations?.legalFlags?.filter(f => f.description) || [];
  const regulatoryFlags = observations?.regulatoryFlags?.filter(f => f.description) || [];

  return (
    <div className="psg-fade-up space-y-4">

      {/* Certification badge */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-advent-navy/5 border border-advent-navy/10 rounded-xl text-xs text-advent-gray-500">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-advent-navy shrink-0">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="font-semibold text-advent-navy">DD Certified</span>
        {ddCertified.dealName && (
          <><span className="text-advent-gray-350">·</span><span className="font-semibold text-advent-gray-700">{ddCertified.dealName}</span></>
        )}
        {ddCertified.analystName && (
          <><span className="text-advent-gray-350">·</span><span>{ddCertified.analystName}</span></>
        )}
        <span className="text-advent-gray-350">·</span>
        <span>{new Date(ddCertified.timestamp).toLocaleDateString()}</span>
        <span className="ml-auto italic text-advent-gray-400 hidden sm:inline">
          Investment due diligence · Not employment screening
        </span>
      </div>

      {/* Main mirror */}
      <div className="psg-card overflow-hidden">

        {/* Column headers */}
        <div className="flex border-b-2 border-advent-gold/40">
          <div className="w-5/12 shrink-0 px-5 py-3.5 bg-advent-navy">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Management Criteria</p>
            {specAnalysis.roleSummary && (
              <p className="text-[11px] text-white/40 mt-0.5 truncate pr-4">{specAnalysis.roleSummary}</p>
            )}
          </div>
          <div className="w-px shrink-0 bg-advent-gold/40" />
          <div className="flex-1 px-5 py-3.5 bg-white">
            <p className="text-[10px] font-bold text-advent-gray-400 uppercase tracking-widest">Public Record Observations</p>
            <p className="text-[10px] text-advent-gray-350 mt-0.5">Factual · Source-cited · No evaluative language</p>
          </div>
        </div>

        {/* Requirement rows */}
        {allRequirements.length === 0 ? (
          <div className="p-10 text-center text-advent-gray-400 text-sm">
            No criteria found in the loaded specification.
          </div>
        ) : (
          allRequirements.map((req, idx) => (
            <MirrorRow
              key={req.id}
              req={req}
              obs={obsMap[req.id] || null}
              loading={loading}
              isLast={idx === allRequirements.length - 1}
            />
          ))
        )}

        {/* Trigger or loading footer */}
        {!loading && !observations && (
          <div className="flex flex-col items-center justify-center py-10 border-t border-advent-gray-100 bg-advent-gray-75">
            <p className="text-sm text-advent-gray-500 mb-4 text-center max-w-sm leading-relaxed">
              DD certification confirmed. Ready to extract public record observations from compiled research.
            </p>
            <button onClick={onRunObserver} className="psg-btn psg-btn-primary">
              Extract Observations
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 py-8 border-t border-advent-gray-100 bg-advent-gray-75">
            <span className="w-4 h-4 border-2 border-advent-gray-350 border-t-advent-blue rounded-full animate-spin shrink-0" />
            <span className="text-sm text-advent-gray-500">Extracting public record observations…</span>
          </div>
        )}
      </div>

      {/* Legal Flags */}
      {legalFlags.length > 0 && (
        <div className="psg-card p-5">
          <h3 className="text-[10px] font-bold text-advent-gray-500 uppercase tracking-widest mb-3">Legal Record Flags</h3>
          <div className="space-y-2">
            {legalFlags.map((f, i) => <FlagRow key={i} flag={f} type="legal" />)}
          </div>
        </div>
      )}

      {/* Regulatory Flags */}
      {regulatoryFlags.length > 0 && (
        <div className="psg-card p-5">
          <h3 className="text-[10px] font-bold text-advent-gray-500 uppercase tracking-widest mb-3">Regulatory Record Flags</h3>
          <div className="space-y-2">
            {regulatoryFlags.map((f, i) => <FlagRow key={i} flag={f} type="regulatory" />)}
          </div>
        </div>
      )}

      {/* Analyst Notes */}
      {observations && (
        <div className="psg-card p-5">
          <label className="psg-label">Analyst Notes</label>
          <textarea
            value={analystNotes}
            onChange={e => setAnalystNotes(e.target.value)}
            placeholder="Add your own observations, context, or follow-up questions here…"
            rows={4}
            className="w-full mt-2 border border-advent-gray-200 rounded-lg px-3 py-2.5 text-sm text-advent-gray-700 resize-y focus:outline-none focus:border-advent-blue focus:ring-1 focus:ring-advent-blue/20 font-[inherit] leading-relaxed"
          />
          <p className="text-[10px] text-advent-gray-400 mt-1.5 italic">
            Analyst notes are stored locally and included in exported DD memos.
          </p>
        </div>
      )}

      {/* DD disclaimer footer */}
      <p className="text-center text-[10px] text-advent-gray-400 italic pb-2 px-4">
        This document contains factual public record observations for investment due diligence purposes only.
        No eligibility determination, employment recommendation, or scoring is expressed or implied.
      </p>
    </div>
  );
}
