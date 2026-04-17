import { callClaude } from '../claudeApi';

/**
 * Spec Observer Agent — extracts factual public-record observations
 * from compiled research for each management assessment criterion.
 *
 * This agent does NOT score, evaluate, or recommend.
 * Output is a structured set of factual observations per requirement,
 * suitable for investment due diligence use only.
 *
 * Replaces: scoring.js (removed in v1.5.8 for FCRA compliance)
 */
export async function agentSpecObserver(leader, pipe, { apiKey, model, signal, specAnalysis }) {
  const company = leader.company ? ' at ' + leader.company : '';

  const mustHave = (specAnalysis.mustHave || []).map((r, i) => ({ ...r, id: i, tier: 'must' }));
  const niceToHave = (specAnalysis.niceToHave || []).slice(0, 6).map((r, i) => ({ ...r, id: i + 100, tier: 'nice' }));
  const allRequirements = [...mustHave, ...niceToHave];

  const briefContext = (pipe.brief || '').slice(0, 22000);
  const legalSnippet = pipe.legal ? JSON.stringify(pipe.legal).slice(0, 4000) : '';
  const regulatorySnippet = pipe.regulatory ? JSON.stringify(pipe.regulatory).slice(0, 4000) : '';

  const prompt = `You are a management due diligence analyst. Your task is to extract ONLY factual observations from the compiled research below — what the public record shows (or does not show) about each management criterion.

SUBJECT: ${leader.name}, ${leader.title}${company}

=== COMPILED RESEARCH ===
${briefContext}

${legalSnippet ? `=== LEGAL RECORD ===\n${legalSnippet}\n` : ''}${regulatorySnippet ? `=== REGULATORY RECORD ===\n${regulatorySnippet}\n` : ''}
=== MANAGEMENT CRITERIA TO ADDRESS ===
${allRequirements.map(r => `[${r.id}] (${r.tier.toUpperCase()}) [${r.category}] ${r.requirement}`).join('\n')}

RULES — strictly enforce:
1. State ONLY facts directly supported by the research above
2. Always cite the source inline (e.g., "LinkedIn", "SEC 10-K 2022", "CourtListener", "Glassdoor")
3. If the research does not address a criterion, write "Not found in public record"
4. NEVER evaluate, rate, or score — do not use words like "strong", "impressive", "concerning", "gap", "fit", "match", "excellent", "weak"
5. NEVER recommend for or against any decision
6. Observations must be falsifiable statements a third party could independently verify

Return ONLY valid JSON (no markdown fences, no commentary before or after):
{
  "observations": [
    {
      "requirementId": 0,
      "requirement": "requirement text",
      "category": "leadership|industry|functional|education|geographic|compensation",
      "tier": "must|nice",
      "observed": ["Fact 1 (Source: X)", "Fact 2 (Source: Y)"],
      "notObserved": "What the record does not address, or null if fully addressed",
      "sourceHints": ["LinkedIn", "SEC EDGAR"]
    }
  ],
  "legalFlags": [
    { "type": "court|regulatory|sanction", "description": "...", "date": "...", "status": "...", "source": "..." }
  ],
  "regulatoryFlags": [
    { "agency": "...", "type": "...", "description": "...", "date": "...", "status": "...", "source": "..." }
  ]
}`;

  const result = await callClaude(
    [{ role: 'user', content: prompt }],
    { apiKey, model, maxTokens: 6000, signal }
  );

  const match = result.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse observer output');
  try {
    return JSON.parse(match[0]);
  } catch {
    throw new Error('Observer output was not valid JSON');
  }
}
