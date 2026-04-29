import { callClaude } from '../claudeApi';

export async function agentVerification(leader, pipe, { apiKey, model, signal }) {
  const company = leader.company ? ' at ' + leader.company : '';
  const profData = typeof pipe.professional === 'string' ? pipe.professional : JSON.stringify(pipe.professional);
  const socialData = pipe.social ? JSON.stringify(pipe.social) : 'No social data';
  const glassdoorData = pipe.glassdoor ? JSON.stringify(pipe.glassdoor) : 'No glassdoor data';
  const legalData = pipe.legal ? JSON.stringify(pipe.legal) : 'No legal data';
  const regData = pipe.regulatory ? JSON.stringify(pipe.regulatory) : 'No regulatory data';

  const prompt = `You are an ADVERSARIAL fact-checker for executive forensic intelligence. CHALLENGE and VERIFY all claims. Be deeply skeptical.

SUBJECT: ${leader.name}, ${leader.title}${company}

=== PROFESSIONAL RESEARCH ===
${(profData || '').slice(0, 12000)}

=== SOCIAL MEDIA ===
${(socialData || '').slice(0, 5000)}

=== GLASSDOOR ===
${(glassdoorData || '').slice(0, 3000)}

=== LEGAL FINDINGS ===
${(legalData || '').slice(0, 5000)}

=== REGULATORY ===
${(regData || '').slice(0, 5000)}

TASKS:
1. Verify identity: Is this the SAME person across all sources?
2. Cross-validate: Do dates, titles, companies match across sources?
3. Search for: "${leader.name}" + "fraud"/"scandal"/"fired"/"controversy"
4. Flag: Any contradictions between data sources
5. Assign confidence: VERIFIED/LIKELY/UNVERIFIED/CONTRADICTED/NOT_FOUND

CRITICAL CITATION REQUIREMENT: Every verified fact MUST include source URLs. Facts without URLs must be downgraded to LIKELY confidence at most. Include url and title for every source.

Return ONLY valid JSON:
{"identityConfirmed":true,"identityNotes":"...","verifiedFacts":[{"claim":"...","confidence":"VERIFIED","sources":[{"url":"...","title":"..."}],"notes":""}],"contradictions":[{"claim":"...","agentSource":"...","conflictingEvidence":"...","resolution":"...","severity":"high|medium|low"}],"redFlags":[{"flag":"...","source":{"url":"...","title":"..."},"severity":"high|medium|low","details":"..."}],"overallConfidenceScore":0.78,"confidenceBreakdown":{"identity":"VERIFIED","currentRole":"VERIFIED","careerHistory":"LIKELY","achievements":"LIKELY","legalFindings":"VERIFIED","regulatoryFindings":"VERIFIED"},"recommendedFollowUp":["..."],"sourcesAppendix":[{"url":"...","title":"...","relevance":"..."}]}`;

  const emptyResult = {
    identityConfirmed: false,
    identityNotes: '',
    verifiedFacts: [],
    contradictions: [],
    redFlags: [],
    overallConfidenceScore: 0,
    confidenceBreakdown: {},
    recommendedFollowUp: [],
    sourcesAppendix: [],
  };

  try {
    const result = await callClaude(
      [{ role: 'user', content: prompt }],
      { apiKey, model, webSearch: true, maxTokens: 16384, signal, searchUses: 10 }
    );

    // Try code-fenced JSON block first, then fall back to bare brace match
    const fenced = result.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    const bare = result.match(/\{[\s\S]*\}/);
    const match = fenced ? fenced[1] : (bare ? bare[0] : null);
    if (!match) {
      console.warn('Verification agent returned no JSON output');
      return emptyResult;
    }
    try {
      return JSON.parse(match);
    } catch (parseErr) {
      console.warn('Verification agent JSON parse failed:', parseErr);
      return emptyResult;
    }
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    console.warn('Verification agent call failed:', e);
    return emptyResult;
  }
}
