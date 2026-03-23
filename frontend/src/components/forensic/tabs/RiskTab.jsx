import { RISK_COLORS } from '../../../utils/constants';

const RISK_ORDER = ['none', 'low', 'medium', 'high', 'critical'];

function maxRisk(a, b) {
  return RISK_ORDER.indexOf(a) > RISK_ORDER.indexOf(b) ? a : b;
}

function RiskItem({ label, level, detail }) {
  const color = RISK_COLORS[level] || '#6b7280';
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-advent-gray-75 rounded-lg mb-2">
      <div className="w-16 text-center flex-shrink-0">
        <span
          className="text-[12px] font-bold px-2.5 py-1 rounded"
          style={{ background: `${color}20`, color }}
        >
          {(level || 'none').toUpperCase()}
        </span>
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm text-[#374151]">{label}</div>
        <div className="text-xs text-advent-gray-500 mt-0.5">{detail}</div>
      </div>
    </div>
  );
}

export default function RiskTab({ pipe, leader }) {
  if (!pipe || !leader) {
    return (
      <div className="text-center py-12 text-advent-gray-500">
        <p>Risk summary will appear after investigation completes.</p>
      </div>
    );
  }

  const v = pipe.verification;
  const l = pipe.legal;
  const r = pipe.regulatory;
  const gd = pipe.glassdoor;

  const conf = v?.overallConfidenceScore;
  const lRisk = l?.overallLitigationRisk || 'none';
  const rRisk = r?.overallRegulatoryRisk || 'none';
  const overallRisk = maxRisk(lRisk, rRisk);
  const rc = RISK_COLORS[overallRisk] || '#6b7280';
  const cc = conf != null ? (conf >= 0.7 ? '#16a34a' : conf >= 0.5 ? '#d97706' : '#dc2626') : '#6b7280';

  const redFlagsCount = (v?.redFlags || []).length;
  const contradictionsCount = (v?.contradictions || []).length;
  const totalCases = l?.totalCasesFound || 0;
  const hasControversial = (pipe.social?.controversialContent || []).length > 0;
  const cultureRisk = gd?.cultureRisk || 'none';

  const confRisk = conf == null ? 'medium' : conf >= 0.7 ? 'low' : conf >= 0.5 ? 'medium' : 'high';
  const redFlagsRisk = redFlagsCount > 2 ? 'high' : redFlagsCount > 0 ? 'medium' : 'none';
  const contradictionsRisk = contradictionsCount > 1 ? 'high' : contradictionsCount > 0 ? 'medium' : 'none';
  const socialRisk = hasControversial ? 'medium' : 'none';

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-8 space-y-6">

      {/* Overall Risk Circle + Header */}
      <div className="flex items-center gap-6 pb-6 border-b-2 border-advent-gray-200">
        <div
          className="w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center flex-shrink-0"
          style={{ borderColor: rc, background: `${rc}10` }}
        >
          <span className="text-lg font-black" style={{ color: rc }}>{overallRisk.toUpperCase()}</span>
          <span className="text-[11px] font-semibold" style={{ color: rc }}>OVERALL RISK</span>
        </div>
        <div>
          <h2 className="text-[22px] font-bold text-[#1a1a2e] mb-1">Risk Summary: {leader.name}</h2>
          <p className="text-[15px] text-advent-gray-500">
            {leader.title}{leader.company ? ' at ' + leader.company : ''}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded" style={{ background: `${cc}15`, color: cc }}>
              Confidence: {conf != null ? (conf * 100).toFixed(0) + '%' : 'N/A'}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded" style={{ background: `${RISK_COLORS[lRisk]}15`, color: RISK_COLORS[lRisk] }}>
              Litigation: {lRisk}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded" style={{ background: `${RISK_COLORS[rRisk]}15`, color: RISK_COLORS[rRisk] }}>
              Regulatory: {rRisk}
            </span>
          </div>
        </div>
      </div>

      {/* Risk Indicators Grid */}
      <div>
        <h3 className="text-base font-bold text-[#991b1b] mb-3">Risk Indicators</h3>
        <RiskItem label="Litigation History" level={lRisk} detail={`${totalCases} court cases found`} />
        <RiskItem
          label="Regulatory Record"
          level={rRisk}
          detail={`${(r?.secActions || []).length} SEC + ${(r?.finraRecords || []).length} FINRA actions`}
        />
        <RiskItem
          label="Verification Confidence"
          level={confRisk}
          detail={`Confidence score: ${conf != null ? (conf * 100).toFixed(0) + '%' : 'unknown'}`}
        />
        <RiskItem label="Red Flags" level={redFlagsRisk} detail={`${redFlagsCount} red flags identified`} />
        <RiskItem label="Contradictions" level={contradictionsRisk} detail={`${contradictionsCount} contradictions found`} />
        <RiskItem
          label="Controversial Content"
          level={socialRisk}
          detail={hasControversial ? 'Controversial social media content found' : 'No controversial content found'}
        />
        {gd && (
          <RiskItem label="Culture Risk" level={cultureRisk} detail="Based on Glassdoor analysis" />
        )}
      </div>

      {/* Red Flags */}
      {redFlagsCount > 0 && (
        <div>
          <h3 className="text-base font-bold text-risk-high mb-3">Red Flags</h3>
          <div className="space-y-2">
            {v.redFlags.map((rf, i) => (
              <div key={i} className="px-4 py-2.5 bg-risk-high/5 border border-risk-high/20 rounded-lg">
                <div className="font-semibold text-sm text-risk-high">[{(rf.severity || '').toUpperCase()}] {rf.flag}</div>
                {rf.details && <div className="text-sm text-[#374151] mt-1">{rf.details}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Next Steps */}
      {(v?.recommendedFollowUp || []).length > 0 && (
        <div>
          <h3 className="text-base font-bold text-[#991b1b] mb-3">Recommended Next Steps</h3>
          <ul className="list-disc ml-5 space-y-1">
            {v.recommendedFollowUp.map((f, i) => (
              <li key={i} className="text-sm text-[#374151]">{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
