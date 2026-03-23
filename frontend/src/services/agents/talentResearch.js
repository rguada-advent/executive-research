import { callClaude } from '../claudeApi';

/**
 * Simplified talent research agent — focuses on LinkedIn profile + last 2 roles.
 * Much faster than the full forensic professionalResearch agent.
 */
export async function agentTalentResearch(leader, { apiKey, model, signal, searchUses = 8 }) {
  const company = leader.company ? ' at ' + leader.company : '';

  const prompt = `You are an executive talent researcher. Do a quick professional lookup for ${leader.name}, ${leader.title}${company}.

SEARCH STRATEGY:
1. "${leader.name}" site:linkedin.com/in/
2. "${leader.name}" ${leader.company || ''} linkedin
3. "${leader.name}" ${leader.title} ${leader.company || ''}

FOCUS ON:
- LinkedIn profile URL (exact URL)
- Current role: title, company, approximate start date
- Previous role (1 most recent): title, company, duration
- Education: highest degree only
- Location (city/metro area)
- One-line professional summary

DO NOT research extensively. This is a quick snapshot, not a deep investigation.

Return ONLY valid JSON:
{
  "linkedinUrl": "https://www.linkedin.com/in/...",
  "currentRole": {"title": "...", "company": "...", "startDate": "..."},
  "previousRole": {"title": "...", "company": "...", "duration": "..."},
  "education": "...",
  "location": "...",
  "summary": "One sentence describing this executive's background and expertise.",
  "profileFound": true
}

If the person cannot be found, set profileFound to false.`;

  const result = await callClaude(
    [{ role: 'user', content: prompt }],
    { apiKey, model, webSearch: true, maxTokens: 2048, signal, searchUses, mode: 'talent' }
  );

  const defaults = {
    linkedinUrl: '', currentRole: null, previousRole: null,
    education: '', location: '', summary: '', profileFound: false,
  };

  let text = (result || '').replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return defaults;

  try {
    return JSON.parse(match[0]);
  } catch {
    try {
      const cleaned = match[0].replace(/,\s*\}/g, '}').replace(/,\s*\]/g, ']');
      return JSON.parse(cleaned);
    } catch {
      return defaults;
    }
  }
}
