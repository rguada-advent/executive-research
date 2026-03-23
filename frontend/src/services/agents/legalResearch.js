import { callClaude } from '../claudeApi';
import { proxyFetch } from '../backendApi';

export async function agentLegalResearch(leader, { apiKey, model, signal, clToken }) {
  const company = leader.company ? ' at ' + leader.company : '';
  const name = leader.name;

  let clCtx = '';
  if (clToken) {
    try {
      const url = `https://www.courtlistener.com/api/rest/v4/search/?type=r&q=%22${encodeURIComponent(name)}%22&order_by=score+desc&page_size=20`;
      const clData = await proxyFetch(url, 'GET', { Authorization: 'Token ' + clToken }, signal);
      if (clData && clData.results) {
        const dkts = clData.results.map(o =>
          `- ${o.caseName || o.case_name || ''} (${o.docket_number || ''}) — ${o.court || ''} — Filed: ${o.date_filed || ''}`
        ).join('\n');
        clCtx = `\n\n=== COURTLISTENER API RESULTS (PACER-sourced federal court records) ===\nRecords found: ${clData.results.length}\n${dkts || 'None'}\n\nIMPORTANT: The above are REAL court records from CourtListener/PACER. Include them in your analysis. Cross-reference with your web search findings. If a CourtListener case matches a web search result, mark it as higher confidence.`;
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      console.warn('CourtListener search error:', e);
    }
  }

  const prompt = `You are a legal research specialist conducting a comprehensive litigation and court records search for ${name}, ${leader.title}${company}.
${clCtx}

SEARCH STRATEGY — use ALL of these searches:
1. "${name}" lawsuit OR plaintiff OR defendant
2. "${name}" v. OR "v. ${name}" court case
3. "${name}" site:courtlistener.com
4. "${name}" site:justia.com
5. "${name}" site:scholar.google.com
6. "${name}" site:judyrecords.com
7. "${name}" indictment OR charged OR convicted
8. "${name}" litigation settlement verdict
9. "${name}" ${leader.company || ''} lawsuit OR legal action
10. "${name}" bankruptcy OR lien OR judgment

IMPORTANT:
- Cover the past 10 years minimum
- Include BOTH federal and state court cases
- Distinguish between cases where the person is a party vs. merely mentioned
- Note case status: open, closed, settled, dismissed
- If CourtListener API results were provided above, incorporate them as HIGH-CONFIDENCE entries and cross-reference with web search findings
- Rate severity: high (criminal, fraud, major civil), medium (employment disputes, contract), low (minor civil, dismissed)

Return ONLY valid JSON:
{"federalCases":[{"caseName":"...","caseNumber":"...","court":"...","filingDate":"...","status":"open|closed|settled|dismissed","role":"plaintiff|defendant|witness|other","summary":"...","severity":"high|medium|low","source":"...","url":"..."}],"stateCases":[{"caseName":"...","caseNumber":"...","court":"...","state":"...","filingDate":"...","status":"...","role":"...","summary":"...","severity":"...","source":"...","url":"..."}],"criminalRecords":[{"description":"...","jurisdiction":"...","date":"...","status":"...","source":"..."}],"bankruptcies":[],"liens":[],"overallLitigationRisk":"none|low|medium|high|critical","summary":"...","totalCasesFound":0,"searchesUsed":0}`;

  try {
    const result = await callClaude(
      [{ role: 'user', content: prompt }],
      { apiKey, model, webSearch: true, maxTokens: 6144, signal, searchUses: 15 }
    );

    const match = result.match(/\{[\s\S]*\}/);
    if (!match) return { federalCases: [], stateCases: [], criminalRecords: [], bankruptcies: [], liens: [], overallLitigationRisk: 'none', summary: 'No results found.', totalCasesFound: 0 };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { federalCases: [], stateCases: [], criminalRecords: [], bankruptcies: [], liens: [], overallLitigationRisk: 'none', summary: 'Parse error.', totalCasesFound: 0 };
    }
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return { federalCases: [], stateCases: [], criminalRecords: [], bankruptcies: [], liens: [], overallLitigationRisk: 'none', summary: 'Error during research.', totalCasesFound: 0 };
  }
}
