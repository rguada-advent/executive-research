const FACT_COLORS = {
  VERIFIED: '#16a34a',
  LIKELY: '#2563eb',
  UNVERIFIED: '#d97706',
  CONTRADICTED: '#dc2626',
  NOT_FOUND: '#6b7280',
};

function FactBadge({ confidence }) {
  const color = FACT_COLORS[confidence] || FACT_COLORS.NOT_FOUND;
  return (
    <span
      className="text-[11px] font-bold px-2 py-0.5 rounded whitespace-nowrap"
      style={{ background: `${color}20`, color }}
    >
      {confidence}
    </span>
  );
}

function BreakdownTag({ label, value }) {
  const color = FACT_COLORS[value] || FACT_COLORS.NOT_FOUND;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded"
      style={{ background: `${color}15`, color }}
    >
      {label}: {value}
    </span>
  );
}

export default function VerificationTab({ verification: v }) {
  if (!v) {
    return (
      <div className="text-center py-12 text-advent-gray-500">
        <p>Verification data will appear after investigation.</p>
      </div>
    );
  }

  const conf = v.overallConfidenceScore ?? 0;
  const confPct = (conf * 100).toFixed(0);
  const cc = conf >= 0.7 ? '#16a34a' : conf >= 0.5 ? '#d97706' : '#dc2626';

  const verified = (v.verifiedFacts || []).filter(f => f.confidence === 'VERIFIED').length;
  const likely = (v.verifiedFacts || []).filter(f => f.confidence === 'LIKELY').length;
  const unver = (v.verifiedFacts || []).filter(f => f.confidence === 'UNVERIFIED').length;
  const contradictions = (v.contradictions || []).length;
  const redFlags = (v.redFlags || []).length;

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-5 pb-5 border-b-2 border-advent-gray-200">
        <div
          className="w-20 h-20 rounded-full border-[3px] flex flex-col items-center justify-center flex-shrink-0"
          style={{ borderColor: cc, background: `${cc}10` }}
        >
          <span className="text-2xl font-black" style={{ color: cc }}>{confPct}%</span>
          <span className="text-[10px] font-semibold" style={{ color: cc }}>CONFIDENCE</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-1">Verification Report</h2>
          <p className="text-sm text-advent-gray-500">
            {verified} verified · {likely} likely · {unver} unverified · {contradictions} contradictions · {redFlags} red flags
          </p>
        </div>
      </div>

      {/* Identity */}
      {v.identityNotes && (
        <div className="px-4 py-3 bg-risk-none/5 border border-risk-none/30 rounded-lg text-sm text-[#166534]">
          <strong>Identity:</strong> {v.identityNotes}
        </div>
      )}

      {/* Due Diligence Alerts */}
      {redFlags > 0 && (
        <div>
          <h3 className="text-base font-bold text-risk-high mb-3 pb-1 border-b border-risk-high/20">Due Diligence Alerts</h3>
          <div className="space-y-2">
            {v.redFlags.map((r, i) => (
              <div key={i} className="px-4 py-2.5 bg-risk-high/5 border border-risk-high/20 rounded-lg">
                <div className="font-semibold text-sm text-risk-high">[{(r.severity || '').toUpperCase()}] {r.flag}</div>
                {r.details && <div className="text-sm text-[#374151] mt-1">{r.details}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contradictions */}
      {contradictions > 0 && (
        <div>
          <h3 className="text-base font-bold text-risk-medium mb-3">Contradictions</h3>
          <div className="space-y-2">
            {v.contradictions.map((c, i) => (
              <div key={i} className="px-4 py-3 bg-risk-medium/5 border border-risk-medium/20 rounded-lg">
                <div className="font-semibold text-sm text-[#92400e] mb-1">{c.claim}</div>
                <div className="text-sm text-[#374151]"><strong>Conflict:</strong> {c.conflictingEvidence}</div>
                {c.resolution && <div className="text-sm text-[#374151]"><strong>Resolution:</strong> {c.resolution}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fact Details */}
      {(v.verifiedFacts || []).length > 0 && (
        <div>
          <h3 className="text-base font-bold text-[#991b1b] mb-3">Fact Details</h3>
          <div className="grid gap-2">
            {v.verifiedFacts.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-advent-gray-75 rounded">
                <FactBadge confidence={f.confidence} />
                <span className="text-sm text-[#374151] flex-1">{f.claim}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Follow-Up */}
      {(v.recommendedFollowUp || []).length > 0 && (
        <div>
          <h3 className="text-base font-bold text-[#991b1b] mb-3">Recommended Follow-Up</h3>
          <ul className="list-disc ml-5 space-y-1">
            {v.recommendedFollowUp.map((f, i) => (
              <li key={i} className="text-sm text-[#374151]">{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence Breakdown */}
      {v.confidenceBreakdown && Object.keys(v.confidenceBreakdown).length > 0 && (
        <div className="px-4 py-3 bg-advent-gray-75 rounded-lg">
          <h4 className="text-sm font-semibold text-[#374151] mb-2">Confidence Breakdown</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(v.confidenceBreakdown).map(([k, val]) => (
              <BreakdownTag key={k} label={k} value={val} />
            ))}
          </div>
        </div>
      )}

      {/* Sources Appendix */}
      {(v.verifiedFacts || []).some(f => (f.sources || []).length > 0) && (
        <div>
          <h3 className="text-base font-bold text-[#991b1b] mb-3">Sources Appendix</h3>
          <div className="space-y-1">
            {v.verifiedFacts
              .flatMap(f => f.sources || [])
              .filter(Boolean)
              .filter((s, i, arr) => arr.indexOf(s) === i)
              .map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer" className="block text-xs text-[#991b1b] hover:underline truncate">
                  {src}
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
