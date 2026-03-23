import { RiskBadge } from '../../shared/Badge';

function SentimentBadge({ sentiment }) {
  const map = {
    positive: 'bg-risk-none/10 text-risk-none',
    negative: 'bg-risk-high/10 text-risk-high',
    mixed: 'bg-risk-medium/10 text-risk-medium',
    neutral: 'bg-advent-gray-500/10 text-advent-gray-500',
  };
  const s = (sentiment || 'neutral').toLowerCase();
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase ${map[s] || map.neutral}`}>
      {s}
    </span>
  );
}

function DirectionBadge({ direction }) {
  const map = {
    improving: 'bg-risk-none/10 text-risk-none',
    declining: 'bg-risk-high/10 text-risk-high',
    stable: 'bg-advent-gray-500/10 text-advent-gray-500',
  };
  const d = (direction || 'stable').toLowerCase();
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase ${map[d] || map.stable}`}>
      {d}
    </span>
  );
}

function RatingCircle({ value, max = 5, label }) {
  const pct = max ? (value / max) * 100 : 0;
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-16 h-16 rounded-full border-[3px] flex flex-col items-center justify-content-center"
        style={{ borderColor: color, background: `${color}10` }}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-xl font-black" style={{ color }}>{value ?? '—'}</span>
          {max && <span className="text-[9px] font-semibold text-advent-gray-500">/ {max}</span>}
        </div>
      </div>
      {label && <span className="text-[11px] text-advent-gray-500 mt-1 text-center">{label}</span>}
    </div>
  );
}

export default function GlassdoorTab({ glassdoor }) {
  if (!glassdoor) {
    return (
      <div className="text-center py-12 text-advent-gray-500">
        <p>Glassdoor data will appear after investigation.</p>
      </div>
    );
  }

  const g = glassdoor;

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-8 space-y-6">
      <h2 className="text-xl font-bold text-[#1a1a2e]">Glassdoor Intelligence</h2>

      {/* Company Overview */}
      {g.companyOverview && (
        <div className="p-5 bg-advent-gray-75 rounded-xl border border-advent-gray-200">
          <h3 className="text-base font-bold text-advent-navy mb-4">Company Overview</h3>
          <div className="flex flex-wrap gap-6 items-center">
            {g.companyOverview.overallRating != null && (
              <RatingCircle value={g.companyOverview.overallRating} max={5} label="Overall" />
            )}
            {g.companyOverview.ceoApproval != null && (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-[3px] border-advent-navy/30 bg-advent-navy/5 flex items-center justify-center">
                  <span className="text-xl font-black text-advent-navy">{g.companyOverview.ceoApproval}%</span>
                </div>
                <span className="text-[11px] text-advent-gray-500 mt-1">CEO Approval</span>
              </div>
            )}
            {g.companyOverview.recommendPct != null && (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-[3px] border-risk-none/50 bg-risk-none/5 flex items-center justify-center">
                  <span className="text-xl font-black text-risk-none">{g.companyOverview.recommendPct}%</span>
                </div>
                <span className="text-[11px] text-advent-gray-500 mt-1">Recommend</span>
              </div>
            )}
            {g.companyOverview.description && (
              <p className="flex-1 min-w-[200px] text-sm text-[#374151]">{g.companyOverview.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Leadership Sentiment */}
      {g.leadershipSentiment && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-base font-bold text-advent-navy">Leadership Sentiment</h3>
            {g.leadershipSentiment.overall && <SentimentBadge sentiment={g.leadershipSentiment.overall} />}
          </div>
          {(g.leadershipSentiment.themes || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {g.leadershipSentiment.themes.map((t, i) => (
                <span key={i} className="text-xs px-2.5 py-1 bg-advent-gray-75 border border-advent-gray-200 rounded-full text-advent-gray-700">
                  {t}
                </span>
              ))}
            </div>
          )}
          {(g.leadershipSentiment.directMentions || []).length > 0 && (
            <div className="space-y-2">
              {g.leadershipSentiment.directMentions.map((m, i) => {
                const quote = typeof m === 'string' ? m : m.quote || m.text || m.context || '';
                const role = typeof m === 'object' ? (m.role || '') : '';
                const date = typeof m === 'object' ? (m.date || '') : '';
                const source = typeof m === 'object' ? (m.source || '') : '';
                const sentiment = typeof m === 'object' ? (m.sentiment || '') : '';
                if (!quote) return null;
                return (
                  <div key={i} className="px-4 py-3 bg-advent-gray-75 rounded-lg border-l-3 border-advent-gray-350">
                    <p className="text-sm text-[#374151] italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-advent-gray-500">
                      {role && <span>{role}</span>}
                      {date && <span>{date}</span>}
                      {source && <span>via {source}</span>}
                      {sentiment && <SentimentBadge sentiment={sentiment} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Culture Indicators */}
      {g.cultureIndicators && (
        <div>
          <h3 className="text-base font-bold text-advent-navy mb-3">Culture Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(g.cultureIndicators.positive || []).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-risk-none uppercase tracking-wide mb-2">Positive</h4>
                <ul className="space-y-1">
                  {g.cultureIndicators.positive.map((p, i) => (
                    <li key={i} className="text-sm text-[#374151] flex items-start gap-1.5">
                      <span className="text-risk-none mt-0.5">&#10003;</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(g.cultureIndicators.negative || []).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-risk-medium uppercase tracking-wide mb-2">Concerns</h4>
                <ul className="space-y-1">
                  {g.cultureIndicators.negative.map((n, i) => (
                    <li key={i} className="text-sm text-[#374151] flex items-start gap-1.5">
                      <span className="text-risk-medium mt-0.5">&#9675;</span> {n}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(g.cultureIndicators.redFlags || []).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-risk-high uppercase tracking-wide mb-2">Red Flags</h4>
                <ul className="space-y-1">
                  {g.cultureIndicators.redFlags.map((r, i) => (
                    <li key={i} className="text-sm text-[#374151] flex items-start gap-1.5">
                      <span className="text-risk-high mt-0.5">&#9888;</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Trends */}
      {g.recentTrends && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-base font-bold text-advent-navy">Recent Trends</h3>
            {g.recentTrends.direction && <DirectionBadge direction={g.recentTrends.direction} />}
          </div>
          {(g.recentTrends.keyChanges || []).length > 0 && (
            <ul className="list-disc ml-5 space-y-1">
              {g.recentTrends.keyChanges.map((c, i) => (
                <li key={i} className="text-sm text-[#374151]">{c}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Executive Mentions */}
      {(g.executiveMentions || []).length > 0 && (
        <div>
          <h3 className="text-base font-bold text-advent-navy mb-3">Executive Mentions</h3>
          <div className="space-y-3">
            {g.executiveMentions.map((m, i) => {
              const quote = typeof m === 'string' ? m : m.quote || m.context || m.text || '';
              const name = typeof m === 'object' ? (m.name || 'Executive') : '';
              const sentiment = typeof m === 'object' ? (m.sentiment || '') : '';
              const source = typeof m === 'object' ? (m.source || '') : '';
              return (
                <div key={i} className="px-4 py-3 bg-advent-gray-75 rounded-lg border border-advent-gray-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    {name && <span className="font-semibold text-sm text-[#374151]">{name}</span>}
                    {sentiment && <SentimentBadge sentiment={sentiment} />}
                    {source && <span className="text-xs text-advent-gray-500">via {source}</span>}
                  </div>
                  {quote && <p className="text-sm text-[#374151] italic">&ldquo;{quote}&rdquo;</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Culture Risk */}
      {(g.overallCultureRisk || g.cultureRisk) && (
        <div className="flex items-center gap-3 pt-4 border-t border-advent-gray-200">
          <span className="text-sm font-semibold text-advent-gray-700">Culture Risk:</span>
          <RiskBadge risk={g.overallCultureRisk || g.cultureRisk} />
        </div>
      )}

      {/* Summary */}
      {g.summary && (
        <div className="px-4 py-3 bg-advent-gray-75 border border-advent-gray-200 rounded-lg">
          <p className="text-sm text-[#374151]">{g.summary}</p>
        </div>
      )}
    </div>
  );
}
