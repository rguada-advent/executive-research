import { RISK_COLORS } from '../../../utils/constants';

const RISK_ORDER = ['none', 'low', 'medium', 'high', 'critical'];

function maxRisk(a, b) {
  return RISK_ORDER.indexOf(a) > RISK_ORDER.indexOf(b) ? a : b;
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  let cls = 'bg-advent-gray-500/10 text-advent-gray-500';
  if (s === 'open') cls = 'bg-risk-high/10 text-risk-high';
  else if (s === 'closed' || s === 'dismissed') cls = 'bg-risk-none/10 text-risk-none';
  else if (s === 'settled') cls = 'bg-risk-medium/10 text-risk-medium';
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase ${cls}`}>{status || 'unknown'}</span>;
}

function CaseCard({ c }) {
  const severityColor = c.severity === 'high' ? '#dc2626' : c.severity === 'medium' ? '#d97706' : '#9ca3af';
  return (
    <div className="px-4 py-3 bg-advent-gray-75 rounded-lg mb-2" style={{ borderLeft: `3px solid ${severityColor}` }}>
      <div className="flex justify-between items-start mb-1 gap-2">
        <span className="font-semibold text-sm text-[#374151] flex-1">{c.caseName || c.description || 'Unknown'}</span>
        <StatusBadge status={c.status} />
      </div>
      {(c.court || c.state || c.filingDate) && (
        <div className="text-xs text-advent-gray-500 mb-0.5">
          {[c.court, c.state, c.caseNumber, c.filingDate].filter(Boolean).join(' · ')}
        </div>
      )}
      {c.role && <div className="text-xs text-advent-gray-500 mb-0.5">Role: {c.role}</div>}
      {c.summary && <div className="text-sm text-[#374151] mt-1">{c.summary}</div>}
      {c.url && (
        <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-[#991b1b] hover:underline mt-1 inline-block">
          Source &rarr;
        </a>
      )}
    </div>
  );
}

function RegCard({ a }) {
  return (
    <div className="px-4 py-3 bg-advent-gray-75 rounded-lg mb-2 border-l-[3px] border-risk-medium">
      <div className="flex justify-between items-start mb-1 gap-2">
        <span className="font-semibold text-sm text-[#374151] flex-1">{a.type || a.agency || 'Action'}</span>
        {a.status && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-risk-medium/10 text-risk-medium uppercase">{a.status}</span>
        )}
      </div>
      {a.date && <div className="text-xs text-advent-gray-500 mb-0.5">{a.date}</div>}
      {a.description && <div className="text-sm text-[#374151] mt-1">{a.description}</div>}
      {a.penalty && <div className="text-sm text-risk-high font-semibold mt-1">Penalty: {a.penalty}</div>}
      {a.url && (
        <a href={a.url} target="_blank" rel="noreferrer" className="text-xs text-[#991b1b] hover:underline mt-1 inline-block">
          Source &rarr;
        </a>
      )}
    </div>
  );
}

export default function LegalTab({ legal, regulatory }) {
  if (!legal && !regulatory) {
    return (
      <div className="text-center py-12 text-advent-gray-500">
        <p>Legal & regulatory data will appear after investigation.</p>
      </div>
    );
  }

  const lRisk = legal?.overallLitigationRisk || 'none';
  const rRisk = regulatory?.overallRegulatoryRisk || 'none';
  const overallRisk = maxRisk(lRisk, rRisk);
  const rc = RISK_COLORS[overallRisk] || '#6b7280';

  const hasRegulatory = (regulatory?.secActions || []).length || (regulatory?.finraRecords || []).length ||
    (regulatory?.dojActions || []).length || (regulatory?.otherRegulatory || []).length || (regulatory?.sanctions || []).length;

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-8 space-y-6">

      {/* Header Risk Circle */}
      <div className="flex items-center gap-5 pb-5 border-b-2 border-advent-gray-200">
        <div
          className="w-20 h-20 rounded-full border-[3px] flex flex-col items-center justify-center flex-shrink-0"
          style={{ borderColor: rc, background: `${rc}10` }}
        >
          <span className="text-base font-black" style={{ color: rc }}>{overallRisk.toUpperCase()}</span>
          <span className="text-[10px] font-semibold" style={{ color: rc }}>RISK</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-1">Legal & Regulatory Report</h2>
          <p className="text-sm text-advent-gray-500">
            Litigation: {lRisk} · Regulatory: {rRisk} · {legal?.totalCasesFound || 0} cases found
          </p>
        </div>
      </div>

      {legal?.summary && (
        <div className="px-4 py-3 bg-advent-gray-75 border border-advent-gray-200 rounded-lg text-sm text-[#374151]">
          {legal.summary}
        </div>
      )}

      {(legal?.federalCases || []).length > 0 && (
        <div>
          <h3 className="text-base font-bold text-[#991b1b] mb-3 pb-1 border-b border-advent-gray-200">Federal Court Cases</h3>
          {legal.federalCases.map((c, i) => <CaseCard key={i} c={c} />)}
        </div>
      )}

      {(legal?.stateCases || []).length > 0 && (
        <div>
          <h3 className="text-base font-bold text-[#991b1b] mb-3 pb-1 border-b border-advent-gray-200">State Court Cases</h3>
          {legal.stateCases.map((c, i) => <CaseCard key={i} c={c} />)}
        </div>
      )}

      {(legal?.criminalRecords || []).length > 0 && (
        <div>
          <h3 className="text-base font-bold text-risk-high mb-3 pb-1 border-b border-risk-high/30">Criminal Records</h3>
          {legal.criminalRecords.map((c, i) => <CaseCard key={i} c={c} />)}
        </div>
      )}

      {((legal?.bankruptcies || []).length || (legal?.liens || []).length) > 0 && (
        <div>
          <h3 className="text-base font-bold text-risk-medium mb-3">Bankruptcies & Liens</h3>
          {[...(legal.bankruptcies || []), ...(legal.liens || [])].map((c, i) => <CaseCard key={i} c={c} />)}
        </div>
      )}

      {/* Regulatory Section */}
      <div className="pt-5 border-t-2 border-advent-gray-200">
        <h3 className="text-base font-bold text-[#991b1b] mb-3">Regulatory Actions</h3>

        {regulatory?.summary && (
          <div className="px-4 py-3 bg-advent-gray-75 border border-advent-gray-200 rounded-lg text-sm text-[#374151] mb-4">
            {regulatory.summary}
          </div>
        )}

        {(regulatory?.secActions || []).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-[#374151] mb-2">SEC Actions</h4>
            {regulatory.secActions.map((a, i) => <RegCard key={i} a={a} />)}
          </div>
        )}
        {(regulatory?.finraRecords || []).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-[#374151] mb-2">FINRA Records</h4>
            {regulatory.finraRecords.map((a, i) => <RegCard key={i} a={a} />)}
          </div>
        )}
        {(regulatory?.dojActions || []).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-[#374151] mb-2">DOJ Actions</h4>
            {regulatory.dojActions.map((a, i) => <RegCard key={i} a={a} />)}
          </div>
        )}
        {(regulatory?.otherRegulatory || []).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-[#374151] mb-2">Other Regulatory</h4>
            {regulatory.otherRegulatory.map((a, i) => <RegCard key={i} a={a} />)}
          </div>
        )}
        {(regulatory?.sanctions || []).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-risk-high mb-2">Sanctions</h4>
            {regulatory.sanctions.map((a, i) => <RegCard key={i} a={a} />)}
          </div>
        )}

        {!hasRegulatory && (
          <p className="text-sm text-advent-gray-500">No regulatory actions found.</p>
        )}
      </div>
    </div>
  );
}
