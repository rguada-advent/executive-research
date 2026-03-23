import { callClaude, streamResponse } from '../claudeApi';

export async function agentBriefSynthesizer(leader, pipe, { apiKey, model, signal, onText, mode }) {
  const company = leader.company ? ' at ' + leader.company : '';
  const v = pipe.verification;
  const hasV = !!v;

  let vCtx = '';
  if (hasV) {
    vCtx = `\n=== VERIFICATION ===\nConfidence: ${((v.overallConfidenceScore || 0) * 100).toFixed(0)}%\nFacts:\n${(v.verifiedFacts || []).map(f => '- ' + f.claim + ': [' + f.confidence + ']').join('\n')}\n${(v.contradictions || []).length ? 'Contradictions:\n' + v.contradictions.map(c => '- ' + c.claim + ': ' + c.conflictingEvidence).join('\n') : ''}\n${(v.redFlags || []).length ? 'Red Flags:\n' + v.redFlags.map(r => '- [' + (r.severity || '').toUpperCase() + '] ' + r.flag).join('\n') : ''}`;
  }

  const contactBlock = pipe.contact
    ? '\n=== CONTACT DATA ===\n' + JSON.stringify(pipe.contact, null, 2).slice(0, 5000)
    : '';

  const socialBlock = pipe.social
    ? '\n=== SOCIAL MEDIA ===\n' + JSON.stringify(pipe.social, null, 2).slice(0, 5000)
    : '';

  const glassdoorBlock = pipe.glassdoor
    ? '\n=== GLASSDOOR & CULTURE INTELLIGENCE ===\n' + JSON.stringify(pipe.glassdoor, null, 2).slice(0, 5000)
    : '';

  const linkedinBlock = pipe.linkedin && pipe.linkedin.profileFound
    ? `\n=== LINKEDIN CONNECTION ANALYSIS ===\nProfile Found: ${pipe.linkedin.profileUrl || 'Yes'}\nHeadline: ${pipe.linkedin.headline || 'N/A'}\nConnection Degree: ${pipe.linkedin.connectionDegree || 'UNKNOWN'}\nShared Connections: ${(pipe.linkedin.sharedConnections || []).length}\n${(pipe.linkedin.sharedConnections || []).map(c => '- ' + c.name + ' (' + c.headline + ')').join('\n')}\n\nIMPORTANT: Include the LinkedIn connection degree prominently in the report. Highlight any 2nd or 3rd degree connections that could serve as referral pathways.`
    : '';

  const legalBlock = pipe.legal
    ? '\n=== LEGAL FINDINGS ===\n' + JSON.stringify(pipe.legal, null, 2).slice(0, 5000)
    : '';

  const regBlock = pipe.regulatory
    ? '\n=== REGULATORY FINDINGS ===\n' + JSON.stringify(pipe.regulatory, null, 2).slice(0, 5000)
    : '';

  const profBrief = typeof pipe.professional === 'string' ? pipe.professional : '';

  const prompt = `You are a forensic intelligence report writer. Compile a comprehensive background investigation report for ${leader.name}, ${leader.title}${company}.\n\nRULES:\n${hasV ? '- Tag facts: [VERIFIED], [LIKELY], [UNVERIFIED], [CONTRADICTED]\n- Include "Due Diligence Alerts" if any red flags\n- Include "Verification Summary" at end' : '- Mark all facts as [Unverified] since verification was unavailable'}\n- Include source URLs as inline links\n- Include ALL contact info and social profiles\n- PROMINENTLY feature any legal or regulatory findings\n- Include risk assessment\n- If LinkedIn connection data is provided, include a "Network Proximity" section showing the connection degree and shared connections\n\n=== PROFESSIONAL RESEARCH ===\n${profBrief.slice(0, 15000)}\n${contactBlock}\n${socialBlock}\n${linkedinBlock}\n${glassdoorBlock}\n${legalBlock}\n${regBlock}\n${vCtx}\n\nFormat as markdown:\n# ${leader.name}\n**${leader.title}${company}**\n*Investigation Confidence: X%*\n\n## Executive Summary\n## Professional Background\n## Career History\n## Education & Credentials\n## Contact Information\n## Social Media & Digital Footprint\n## Network Proximity & LinkedIn Connections\n## Glassdoor & Culture Intelligence\n## Board Memberships & Advisory Roles\n## Legal History\n## Regulatory Record\n## Due Diligence Alerts\n## Risk Assessment\n## Verification Summary`;

  try {
    const r = await callClaude(
      [{ role: 'user', content: prompt }],
      { apiKey, model, stream: true, maxTokens: 12288, signal, mode: mode || 'forensic' }
    );

    let fullMd = '';
    return await streamResponse(
      r,
      (chunk, acc) => { fullMd = acc; onText?.(chunk, acc); },
      () => {}
    );
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw e;
  }
}
