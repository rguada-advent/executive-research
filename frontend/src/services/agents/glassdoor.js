import { callClaude } from '../claudeApi';
import { searchGlassdoor } from '../backendApi';

export async function agentGlassdoor(leader, { apiKey, model, signal, searchUses = 10 }) {
  const company = leader.company || '';
  if (!company) return {
    error: 'No company specified',
    companyOverview: {},
    leadershipSentiment: { overall: 'unknown' },
    cultureIndicators: {},
    recentTrends: {},
    executiveMentions: [],
    overallCultureRisk: 'none',
    summary: 'No company specified.',
  };

  // Step 1: Scrape Glassdoor via backend
  let glassdoorData = null;
  try {
    glassdoorData = await searchGlassdoor(company, signal);
  } catch (e) {
    if (e.name === 'AbortError') throw e;
  }

  const gdCtx = glassdoorData && !glassdoorData.error
    ? `\n=== GLASSDOOR DATA (scraped) ===\nOverall Rating: ${glassdoorData.overallRating || 'N/A'}\nCEO Approval: ${glassdoorData.ceoApproval || 'N/A'}\nTotal Reviews: ${glassdoorData.totalReviews}\nRecent Reviews:\n${(glassdoorData.recentReviews || []).map(r => `- "${r.title}" | Pros: ${r.pros} | Cons: ${r.cons}`).join('\n')}\n`
    : '';

  // Step 2: Claude web search for Glassdoor intelligence
  const prompt = `You are a corporate culture and employer brand analyst. Conduct a thorough Glassdoor and employer review analysis for ${company}, focusing on what employees say about senior leadership${leader.name ? ', especially ' + leader.name : ''}.
${gdCtx}

SEARCH STRATEGY:
1. "${company}" site:glassdoor.com reviews
2. "${company}" glassdoor CEO rating
3. "${company}" employee reviews leadership culture
4. "${company}" glassdoor pros cons
5. ${leader.name ? `"${leader.name}" "${company}" glassdoor OR employee review` : `"${company}" CEO leadership style employee feedback`}
6. "${company}" workplace culture toxic OR positive
7. "${company}" glassdoor layoffs OR restructuring

ANALYZE AND RETURN ONLY VALID JSON:
{
  "companyOverview": {
    "overallRating": null,
    "ceoApprovalRating": null,
    "recommendToFriend": null,
    "totalReviews": 0,
    "glassdoorUrl": ""
  },
  "leadershipSentiment": {
    "overall": "positive|mixed|negative|unknown",
    "themes": [],
    "directMentions": [{"quote": "...", "date": "...", "role": "...", "sentiment": "positive|negative|neutral"}]
  },
  "cultureIndicators": {
    "positive": ["..."],
    "negative": ["..."],
    "redFlags": ["..."]
  },
  "recentTrends": {
    "direction": "improving|stable|declining|unknown",
    "keyChanges": ["..."],
    "layoffMentions": false
  },
  "executiveMentions": [{"name": "...", "sentiment": "...", "context": "...", "source": "..."}],
  "overallCultureRisk": "none|low|medium|high|critical",
  "summary": "..."
}`;

  const result = await callClaude(
    [{ role: 'user', content: prompt }],
    { apiKey, model, webSearch: true, maxTokens: 6144, signal, searchUses }
  );

  const defaults = {
    companyOverview: {},
    leadershipSentiment: { overall: 'unknown' },
    cultureIndicators: {},
    recentTrends: {},
    executiveMentions: [],
    overallCultureRisk: 'none',
    summary: 'No Glassdoor data found.',
    glassdoorScraped: glassdoorData,
  };

  const match = result.match(/\{[\s\S]*\}/);
  if (!match) return defaults;

  try {
    const parsed = JSON.parse(match[0]);
    parsed.glassdoorScraped = glassdoorData;
    return parsed;
  } catch {
    return { ...defaults, summary: 'Parse error.' };
  }
}
