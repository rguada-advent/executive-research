import { callClaude } from '../claudeApi';

/**
 * LinkedIn Research Agent — uses Claude web search to find LinkedIn profile data,
 * connection context, and network information. No cookies or proxy needed.
 */
export async function agentLinkedInResearch(leader, { apiKey, model, signal, searchUses = 8 }) {
  const company = leader.company || '';
  const title = leader.title || '';

  const prompt = `You are a LinkedIn intelligence researcher. Search for the LinkedIn profile and professional network information of ${leader.name}, ${title}${company ? ' at ' + company : ''}.

SEARCH STRATEGY:
1. "${leader.name}" site:linkedin.com/in/
2. "${leader.name}" ${company} linkedin profile
3. "${leader.name}" ${company} linkedin connections OR network
4. "${leader.name}" ${company} linkedin recommendations OR endorsements
5. "${leader.name}" linkedin ${title} career

GATHER:
- LinkedIn profile URL (exact URL if found)
- Current headline and summary
- Career history as shown on LinkedIn
- Number of connections (if visible)
- Notable connections or mutual contacts in the industry
- Recommendations or endorsements highlights
- Posts or articles they've published on LinkedIn
- Groups or associations they belong to
- Any speaking engagements or thought leadership via LinkedIn

RETURN ONLY VALID JSON:
{
  "profileFound": true,
  "profileUrl": "https://www.linkedin.com/in/...",
  "headline": "...",
  "summary": "...",
  "connectionCount": "500+",
  "careerHistory": [
    {"title": "...", "company": "...", "duration": "...", "current": true}
  ],
  "notableConnections": ["..."],
  "recommendations": [
    {"from": "...", "role": "...", "snippet": "..."}
  ],
  "linkedinActivity": {
    "posts": [],
    "articles": [],
    "engagementLevel": "active|moderate|low|unknown"
  },
  "networkInsights": "...",
  "error": null
}

If the person cannot be found on LinkedIn, set profileFound to false and explain in error field.`;

  const result = await callClaude(
    [{ role: 'user', content: prompt }],
    { apiKey, model, webSearch: true, maxTokens: 4096, signal, searchUses }
  );

  const defaults = {
    profileFound: false,
    profileUrl: '',
    headline: '',
    summary: '',
    connectionCount: 'Unknown',
    careerHistory: [],
    notableConnections: [],
    recommendations: [],
    linkedinActivity: { posts: [], articles: [], engagementLevel: 'unknown' },
    networkInsights: '',
    error: 'No LinkedIn data found.'
  };

  const match = result.match(/\{[\s\S]*\}/);
  if (!match) return defaults;

  try {
    return JSON.parse(match[0]);
  } catch {
    return { ...defaults, error: 'Parse error.' };
  }
}
