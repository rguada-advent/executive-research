import { callClaude } from '../claudeApi';

export async function agentRegulatoryCompliance(leader, { apiKey, model, signal }) {
  const company = leader.company ? ' at ' + leader.company : '';

  const prompt = `You are a regulatory compliance investigator. Search for any regulatory actions, enforcement proceedings, or compliance issues involving ${leader.name}, ${leader.title}${company}.

SEARCH STRATEGY:
1. "${leader.name}" site:sec.gov enforcement OR "litigation release"
2. "${leader.name}" SEC enforcement action OR investigation
3. "${leader.name}" site:brokercheck.finra.org
4. "${leader.name}" FINRA disciplinary OR sanction
5. "${leader.name}" OFAC OR sanctions list
6. "${leader.name}" regulatory action OR compliance violation
7. "${leader.name}" ${leader.company || ''} SEC proxy filing DEF 14A
8. "${leader.name}" FDA warning OR enforcement (if pharma/healthcare)
9. "${leader.name}" DOJ investigation OR indictment
10. "${leader.name}" consent decree OR cease and desist

Check:
- SEC enforcement actions and litigation releases
- FINRA BrokerCheck disciplinary records
- OFAC sanctions list
- DOJ press releases
- State attorney general actions
- Industry-specific regulators (FDA, EPA, FTC, etc.)

Return ONLY valid JSON:
{"secActions":[{"type":"enforcement|litigation_release|admin_proceeding","date":"...","description":"...","status":"pending|resolved|settled","penalty":"...","url":"..."}],"finraRecords":[{"type":"disciplinary|customer_dispute|regulatory","date":"...","description":"...","status":"...","url":"..."}],"dojActions":[],"otherRegulatory":[{"agency":"...","type":"...","date":"...","description":"...","status":"...","url":"..."}],"sanctions":[],"overallRegulatoryRisk":"none|low|medium|high|critical","summary":"..."}`;

  try {
    const result = await callClaude(
      [{ role: 'user', content: prompt }],
      { apiKey, model, webSearch: true, maxTokens: 4096, signal, searchUses: 12 }
    );

    const match = result.match(/\{[\s\S]*\}/);
    if (!match) return { secActions: [], finraRecords: [], dojActions: [], otherRegulatory: [], sanctions: [], overallRegulatoryRisk: 'none', summary: 'No regulatory issues found.' };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { secActions: [], finraRecords: [], dojActions: [], otherRegulatory: [], sanctions: [], overallRegulatoryRisk: 'none', summary: 'Parse error.' };
    }
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return { secActions: [], finraRecords: [], dojActions: [], otherRegulatory: [], sanctions: [], overallRegulatoryRisk: 'none', summary: 'Error during research.' };
  }
}
