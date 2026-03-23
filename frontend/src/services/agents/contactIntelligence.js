import { callClaude } from '../claudeApi';

export async function agentContactIntelligence(leader, { apiKey, model, signal }) {
  const company = leader.company ? ' at ' + leader.company : '';
  const domain = leader.company
    ? leader.company.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.com'
    : 'company.com';
  const fn = leader.name.split(' ')[0]?.toLowerCase() || '';
  const ln = leader.name.split(' ').slice(-1)[0]?.toLowerCase() || '';

  const prompt = `You are a contact information discovery specialist. Find verifiable contact details for ${leader.name}, ${leader.title}${company}.\n\nStrategies: company website, SEC filings, conference directories, industry associations, patent filings, charity boards.\n\nInfer likely emails (mark as [INFERRED]):\n- ${fn}.${ln}@${domain}\n- ${fn[0]}${ln}@${domain}\n- ${fn}@${domain}\n\nReturn ONLY valid JSON:\n{"professionalEmails":[{"email":"...","type":"confirmed|inferred","source":"...","confidence":"high|medium|low"}],"personalEmails":[],"phones":[{"number":"...","type":"office|mobile","source":"...","confidence":"..."}],"officeAddress":{"address":"...","source":"..."},"assistantInfo":null}`;

  try {
    const result = await callClaude(
      [{ role: 'user', content: prompt }],
      { apiKey, model, webSearch: true, maxTokens: 4096, signal, searchUses: 12 }
    );

    const match = result.match(/\{[\s\S]*\}/);
    if (!match) return { professionalEmails: [], personalEmails: [], phones: [], officeAddress: null };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { professionalEmails: [], personalEmails: [], phones: [], officeAddress: null };
    }
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return { professionalEmails: [], personalEmails: [], phones: [], officeAddress: null };
  }
}
