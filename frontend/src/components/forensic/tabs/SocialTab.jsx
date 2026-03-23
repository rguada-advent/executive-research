const DEGREE_MAP = {
  FIRST_DEGREE: '1st', SECOND_DEGREE: '2nd', THIRD_DEGREE: '3rd',
  OUT_OF_NETWORK: 'Out', DISTANCE_1: '1st', DISTANCE_2: '2nd', DISTANCE_3: '3rd',
};
const DEGREE_COLORS = {
  '1st': 'text-risk-none border-risk-none',
  '2nd': 'text-[#0a66c2] border-[#0a66c2]',
  '3rd': 'text-risk-medium border-risk-medium',
  'Out': 'text-advent-gray-500 border-advent-gray-350',
};

function ConfidenceTag({ confidence }) {
  const map = {
    high: 'bg-risk-none/10 text-risk-none',
    medium: 'bg-risk-medium/10 text-risk-medium',
    low: 'bg-advent-gray-500/10 text-advent-gray-500',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${map[confidence] || map.low}`}>
      {confidence || 'low'}
    </span>
  );
}

function initials(name) {
  return (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function SocialTab({ social, linkedin }) {
  if (!social?.profiles && !linkedin) {
    return (
      <div className="text-center py-12 text-advent-gray-500">
        <p>Social media data will appear after investigation.</p>
      </div>
    );
  }

  const deg = DEGREE_MAP[linkedin?.connectionDegree] || linkedin?.connectionDegree || 'Unknown';
  const degColor = DEGREE_COLORS[deg] || DEGREE_COLORS['Out'];

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-8 space-y-6">
      <h2 className="text-xl font-bold text-[#1a1a2e]">Social Media & Digital Footprint</h2>

      {/* LinkedIn Connection Analysis */}
      {linkedin?.profileFound && (
        <div className="p-5 bg-[#0a66c2]/5 border border-[#0a66c2]/25 rounded-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#0a66c2] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-lg">in</span>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[#1a1a2e]">LinkedIn Connection Analysis</h3>
              {linkedin.headline && <p className="text-sm text-advent-gray-500 mt-0.5">{linkedin.headline}</p>}
            </div>
            <div className={`text-center border-2 rounded-full w-14 h-14 flex flex-col items-center justify-center ${degColor}`}>
              <span className="text-xl font-black">{deg}</span>
              <span className="text-[9px] font-bold uppercase">Degree</span>
            </div>
          </div>

          {linkedin.profileUrl && (
            <div className="mb-3">
              <a href={linkedin.profileUrl} target="_blank" rel="noreferrer" className="text-[#0a66c2] text-sm font-semibold hover:underline">
                View LinkedIn Profile &rarr;
              </a>
            </div>
          )}

          {/* Notable Connections or Shared Connections */}
          {((linkedin.notableConnections || []).length > 0 || (linkedin.sharedConnections || []).length > 0) && (
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-[#374151] mb-2">
                {linkedin.sharedConnections ? `Shared Connections (${linkedin.sharedConnections.length})` : `Notable Connections (${linkedin.notableConnections.length})`}
              </h4>
              <div className="grid gap-1.5">
                {(linkedin.sharedConnections || linkedin.notableConnections || []).map((sc, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-white rounded border border-advent-gray-200">
                    <div className="w-8 h-8 rounded-full bg-[#0a66c2]/10 flex items-center justify-center text-[#0a66c2] font-bold text-xs flex-shrink-0">
                      {typeof sc === 'string' ? sc.slice(0,2).toUpperCase() : initials(sc.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#374151]">
                        {typeof sc === 'string' ? sc : (sc.profileUrl ? (
                          <a href={sc.profileUrl} target="_blank" rel="noreferrer" className="hover:underline">{sc.name}</a>
                        ) : sc.name)}
                      </div>
                      {sc.headline && <div className="text-xs text-advent-gray-500 truncate">{sc.headline}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LinkedIn Activity */}
          {linkedin.linkedinActivity?.engagementLevel && linkedin.linkedinActivity.engagementLevel !== 'unknown' && (
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-[#374151] mb-1">LinkedIn Activity</h4>
              <p className="text-sm text-advent-gray-500">Engagement level: <span className="font-semibold capitalize">{linkedin.linkedinActivity.engagementLevel}</span></p>
            </div>
          )}

          {/* Network Insights */}
          {linkedin.networkInsights && (
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-[#374151] mb-1">Network Insights</h4>
              <p className="text-sm text-advent-gray-500">{linkedin.networkInsights}</p>
            </div>
          )}

          {/* Connection Count */}
          {linkedin.connectionCount && (
            <p className="text-sm text-advent-gray-500 mt-2">Connections: <span className="font-semibold">{linkedin.connectionCount}</span></p>
          )}
        </div>
      )}

      {linkedin?.error && (
        <div className="p-4 bg-risk-high/5 border border-risk-high/30 rounded-lg flex items-center gap-2">
          <span className="text-risk-high font-bold text-sm">LinkedIn Scan:</span>
          <span className="text-sm text-[#374151]">{linkedin.error}</span>
        </div>
      )}

      {/* Social Profiles */}
      <div>
        <h3 className="text-base font-bold text-[#991b1b] mb-3 pb-1 border-b border-advent-gray-200">Profiles Found</h3>
        <div className="space-y-2">
          {Object.entries(social?.profiles || {})
            .filter(([, v]) => v && (v.url || v.handle))
            .map(([platform, data]) => (
              <div key={platform} className="flex items-center gap-3 px-4 py-3 bg-advent-gray-75 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-[#991b1b]/10 flex items-center justify-center font-bold text-[#991b1b] text-sm flex-shrink-0">
                  {platform.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#374151]">
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    {data.handle ? ` (@${data.handle})` : ''}
                  </div>
                  {(data.headline || data.bio) && (
                    <div className="text-xs text-advent-gray-500 mt-0.5 truncate">{data.headline || data.bio}</div>
                  )}
                  {data.url && (
                    <a href={data.url} target="_blank" rel="noreferrer" className="text-xs text-[#991b1b] hover:underline truncate block">{data.url}</a>
                  )}
                </div>
                <ConfidenceTag confidence={data.confidence} />
              </div>
            ))}
          {!Object.values(social?.profiles || {}).some(v => v && (v.url || v.handle)) && (
            <p className="text-sm text-advent-gray-500">No profiles found.</p>
          )}
        </div>
      </div>

      {/* Controversial Content */}
      {(social?.controversialContent || []).length > 0 && (
        <div>
          <h3 className="text-base font-bold text-risk-high mb-3 pb-1 border-b border-risk-high/30">Controversial Content</h3>
          <div className="space-y-2">
            {social.controversialContent.map((c, i) => (
              <div key={i} className="px-4 py-2.5 bg-risk-high/5 border border-risk-high/20 rounded-lg text-sm text-[#374151]">
                {typeof c === 'string' ? c : c.description || JSON.stringify(c)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media Mentions */}
      {(social?.mediaQuotes || []).length > 0 && (
        <div>
          <h3 className="text-base font-bold text-[#991b1b] mb-3">Media Mentions</h3>
          <div className="space-y-1.5">
            {social.mediaQuotes.map((q, i) => (
              <div key={i} className="px-3 py-2 bg-advent-gray-75 rounded text-sm text-[#374151]">
                {typeof q === 'string' ? q : q.quote || JSON.stringify(q)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Podcast Appearances */}
      {(social?.podcastAppearances || []).length > 0 && (
        <div>
          <h3 className="text-base font-bold text-[#991b1b] mb-3">Podcast Appearances</h3>
          <ul className="list-disc ml-5 space-y-1">
            {social.podcastAppearances.map((p, i) => (
              <li key={i} className="text-sm text-[#374151]">
                {typeof p === 'string' ? p : p.name || JSON.stringify(p)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Speaking Engagements */}
      {(social?.speakingEngagements || []).length > 0 && (
        <div>
          <h3 className="text-base font-bold text-[#991b1b] mb-3">Speaking Engagements</h3>
          <ul className="list-disc ml-5 space-y-1">
            {social.speakingEngagements.map((s, i) => (
              <li key={i} className="text-sm text-[#374151]">
                {typeof s === 'string' ? s : s.event || JSON.stringify(s)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
