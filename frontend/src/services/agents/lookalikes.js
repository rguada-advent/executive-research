import { callClaude } from '../claudeApi';

/**
 * Lookalikes agent — finds executives with similar profiles to a given leader.
 * Returns a simple list of name, title, company, LinkedIn URL.
 */
export async function agentLookalikes(leader, researchData, { apiKey, model, signal, searchUses = 12 }) {
  const company = leader.company || '';
  const title = leader.title || '';

  // Build context from research data if available
  const context = researchData ? `
REFERENCE PROFILE:
- Name: ${leader.name}
- Title: ${title} at ${company}
- Summary: ${researchData.summary || 'N/A'}
- Previous Role: ${researchData.previousRole ? `${researchData.previousRole.title} at ${researchData.previousRole.company}` : 'N/A'}
- Education: ${researchData.education || 'N/A'}
- Location: ${researchData.location || 'N/A'}
` : `
REFERENCE PROFILE:
- Name: ${leader.name}
- Title: ${title} at ${company}
`;

  const prompt = `You are an executive talent sourcing specialist. Find executives who have a SIMILAR profile to the reference person below — similar title, function, industry, seniority level, and career trajectory.
${context}
SEARCH STRATEGY:
1. Search for people with similar titles at competitor companies: "${title}" OR similar title at peer companies
2. Search LinkedIn for "${title}" in the same industry
3. Search for executives who previously held similar roles
4. Search for people at companies in the same sector as ${company}
5. Look for people who moved from similar companies or have similar career paths

CRITERIA FOR LOOKALIKES:
- Similar seniority level (same or adjacent level)
- Similar functional area (e.g., if reference is SVP Commercial, find other SVPs in Commercial/Sales)
- Similar industry or adjacent industries
- Ideally at competitor or peer companies
- Currently employed (not retired/between roles)

Find 10-15 lookalike executives.

Return ONLY a valid JSON array:
[
  {
    "name": "Full Name",
    "title": "Current Title",
    "company": "Current Company",
    "linkedinUrl": "https://www.linkedin.com/in/...",
    "similarity": "Brief explanation of why this person is a lookalike"
  }
]

CRITICAL: Only include real people you can verify. Do NOT fabricate names or LinkedIn URLs.`;

  const result = await callClaude(
    [{ role: 'user', content: prompt }],
    { apiKey, model, webSearch: true, maxTokens: 6144, signal, searchUses, mode: 'talent' }
  );

  let text = (result || '').replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    console.warn('[Lookalikes] No JSON array found in response');
    return [];
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    try {
      const cleaned = match[0].replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}');
      return JSON.parse(cleaned);
    } catch {
      console.error('[Lookalikes] JSON parse failed');
      return [];
    }
  }
}
