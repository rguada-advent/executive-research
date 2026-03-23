import { callClaude } from '../claudeApi';

export async function agentCompanyDiscovery(company, func, seniority, titleFilter, { apiKey, model, signal }) {
  const senMap = {
    'c-suite': 'C-Suite (CEO, CFO, CTO, COO, CMO, CHRO, CLO, CIO)',
    'svp': 'Senior Vice President (SVP) or Executive Vice President (EVP)',
    'vp': 'Vice President (VP)',
    'director': 'Director or Senior Director',
    'all': 'all senior leadership levels (C-Suite, SVP, VP, Director)',
  };
  const senLabel = senMap[seniority] || senMap['all'];
  const funcFilter = func
    ? `Focus specifically on the ${func} function/department.`
    : 'Search across all executive functions.';
  const titleHint = titleFilter
    ? `\n\nTITLE FILTER: The user is specifically looking for people with titles matching or similar to "${titleFilter}". Prioritize executives whose title contains or closely matches this. For example, if the user searches "Commercial Operations" find SVPs/VPs of Commercial Operations, Commercial Strategy, etc.`
    : '';

  const prompt = `You are an expert executive talent researcher. Systematically discover ${senLabel} executives at ${company}.

${funcFilter}${titleHint}

SEARCH STRATEGY — search thoroughly:
1. Search "${company} leadership team" and "${company} executives"
2. Search "${company} ${titleFilter || func || 'senior'} leaders LinkedIn"
3. Search "${company} proxy statement DEF 14A executive officers" (SEC filings)
4. Search "${company} ${titleFilter || func || ''} SVP OR VP OR Director"
5. Search "${company} organizational announcements promotions"${titleFilter ? `\n6. Search "${company} ${titleFilter}" specifically` : ''}
6. Search for conference speakers, press releases, industry directories

For EACH executive found, extract:
- Full name
- Exact current title
- Seniority level (c-suite, svp, vp, director, other)
- Source where you found them (URL if available)

CRITICAL: Only include people you can verify currently work at ${company}. Do NOT fabricate names.${titleFilter ? `\nPRIORITY: Put executives matching "${titleFilter}" at the top of the list.` : ''}

Return ONLY a valid JSON array:
[{"name":"Jane Smith","title":"SVP, Commercial Operations","seniority":"svp","source":"LinkedIn","confidence":"high"},...]

Find as many matching executives as possible. Aim for 10-25 results.`;

  console.log('[CompanyDiscovery] Calling Claude with web search for:', company, func, seniority, titleFilter);

  const result = await callClaude(
    [{ role: 'user', content: prompt }],
    { apiKey, model, webSearch: true, maxTokens: 8192, signal, searchUses: 15, mode: 'talent' }
  );

  console.log('[CompanyDiscovery] Raw result length:', result?.length, 'First 500 chars:', result?.slice(0, 500));

  // Try to extract JSON array — handle markdown code fences
  let text = result || '';
  // Strip markdown code fences if present
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    console.warn('[CompanyDiscovery] No JSON array found in response. Full response:', text.slice(0, 2000));
    return [];
  }

  try {
    const parsed = JSON.parse(match[0]);
    console.log('[CompanyDiscovery] Parsed', parsed.length, 'executives');
    return parsed;
  } catch (e) {
    console.warn('[CompanyDiscovery] JSON parse failed:', e.message, 'Attempting cleanup...');
    // Try to fix common JSON issues (trailing commas, etc.)
    try {
      const cleaned = match[0]
        .replace(/,\s*\]/g, ']')  // trailing comma before ]
        .replace(/,\s*\}/g, '}')  // trailing comma before }
        .replace(/\n/g, ' ');     // newlines in strings
      const parsed = JSON.parse(cleaned);
      console.log('[CompanyDiscovery] Cleaned parse succeeded:', parsed.length, 'executives');
      return parsed;
    } catch (e2) {
      console.error('[CompanyDiscovery] Cleaned parse also failed:', e2.message);
      return [];
    }
  }
}
