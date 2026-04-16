import { callClaude, streamResponse } from '../claudeApi';

/**
 * Build the LinkedIn section of the prompt.
 *
 * Emits a compact block whenever ANY LinkedIn data is present (not just when
 * `profileFound === true`). When the agent returned no data at all, emits a
 * short note so the report can acknowledge the gap without dropping the
 * Network Proximity section silently.
 *
 * Intentionally conservative: avoids mandating output structure so the main
 * prompt can stay loose — previous rigid "ALL SECTIONS MUST APPEAR" language
 * caused Claude to produce malformed briefs under large context loads.
 */
function buildLinkedInBlock(linkedin) {
  if (!linkedin || (typeof linkedin === 'object' && !linkedin.profileFound && !linkedin.profileUrl && !linkedin.headline && !(linkedin.sharedConnections || []).length && !(linkedin.notableConnections || []).length)) {
    return `\n=== LINKEDIN CONNECTION ANALYSIS ===\nLinkedIn data could not be located for this subject. Note this gap in the Network Proximity section.`;
  }

  const lines = ['=== LINKEDIN CONNECTION ANALYSIS ==='];
  lines.push(`Profile Found: ${linkedin.profileFound ? 'Yes' : 'Partial'}`);
  if (linkedin.profileUrl) lines.push(`Profile URL: ${linkedin.profileUrl}`);
  if (linkedin.headline) lines.push(`Headline: ${linkedin.headline}`);
  if (linkedin.connectionDegree) lines.push(`Connection Degree: ${linkedin.connectionDegree}`);
  if (linkedin.connectionCount) lines.push(`Connection Count: ${linkedin.connectionCount}`);

  const shared = (linkedin.sharedConnections || []).slice(0, 15);
  const notable = (linkedin.notableConnections || []).slice(0, 15);
  if (shared.length) {
    lines.push(`Shared Connections (${shared.length}):`);
    shared.forEach(c => {
      const name = typeof c === 'string' ? c : c.name;
      const headline = typeof c === 'object' && c.headline ? ` — ${c.headline}` : '';
      if (name) lines.push(`- ${name}${headline}`);
    });
  }
  if (notable.length) {
    lines.push(`Notable Connections (${notable.length}):`);
    notable.forEach(c => {
      const name = typeof c === 'string' ? c : c.name;
      const headline = typeof c === 'object' && c.headline ? ` — ${c.headline}` : '';
      if (name) lines.push(`- ${name}${headline}`);
    });
  }

  if (linkedin.networkInsights) lines.push(`Network Insights: ${linkedin.networkInsights}`);
  if (linkedin.linkedinActivity?.engagementLevel && linkedin.linkedinActivity.engagementLevel !== 'unknown') {
    lines.push(`LinkedIn Activity: ${linkedin.linkedinActivity.engagementLevel}`);
  }

  return '\n' + lines.join('\n');
}

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

  const linkedinBlock = buildLinkedInBlock(pipe.linkedin);

  const legalBlock = pipe.legal
    ? '\n=== LEGAL FINDINGS ===\n' + JSON.stringify(pipe.legal, null, 2).slice(0, 5000)
    : '';

  const regBlock = pipe.regulatory
    ? '\n=== REGULATORY FINDINGS ===\n' + JSON.stringify(pipe.regulatory, null, 2).slice(0, 5000)
    : '';

  const profBrief = typeof pipe.professional === 'string' ? pipe.professional : '';

  const prompt = `You are a forensic intelligence report writer. Compile a comprehensive background investigation report for ${leader.name}, ${leader.title}${company}.\n\nRULES:\n${hasV ? '- Tag facts: [VERIFIED], [LIKELY], [UNVERIFIED], [CONTRADICTED]\n- Include "Due Diligence Alerts" if any red flags\n- Include "Verification Summary" at end' : '- Mark all facts as [Unverified] since verification was unavailable'}\n- Include source URLs as inline links\n- Include ALL contact info and social profiles\n- PROMINENTLY feature any legal or regulatory findings\n- Include risk assessment\n- Always include a "Network Proximity & LinkedIn Connections" section. If LinkedIn data is unavailable, state that in that section rather than omitting it.\n\n=== PROFESSIONAL RESEARCH ===\n${profBrief.slice(0, 15000)}\n${contactBlock}\n${socialBlock}\n${linkedinBlock}\n${glassdoorBlock}\n${legalBlock}\n${regBlock}\n${vCtx}\n\nFormat as markdown:\n# ${leader.name}\n**${leader.title}${company}**\n*Investigation Confidence: X%*\n\n## Executive Summary\n## Professional Background\n## Career History\n## Education & Credentials\n## Contact Information\n## Social Media & Digital Footprint\n## Network Proximity & LinkedIn Connections\n## Glassdoor & Culture Intelligence\n## Board Memberships & Advisory Roles\n## Legal History\n## Regulatory Record\n## Due Diligence Alerts\n## Risk Assessment\n## Verification Summary`;

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
