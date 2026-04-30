import { callClaude, streamResponse } from '../claudeApi';

export async function agentProfessionalResearch(leader, { apiKey, model, signal, onText, onSearch, linkedInData }) {
  const company = leader.company ? ' at ' + leader.company : '';

  let liCtx = '';
  if (linkedInData) {
    liCtx = '\n\nLinkedIn data:\n' + linkedInData;
  }

  const prompt = `You are a forensic background researcher. Conduct a thorough background investigation of ${leader.name}, ${leader.title}${company}.\n\nCRITICAL: Never fabricate facts. If not found, say "Not found." Every claim must come from a search result. This is for due diligence — accuracy is paramount.\n\n# ${leader.name}\n**${leader.title}${company}**\n\n## Professional Summary\n## Career History (with dates — verify gaps)\n## Published Articles & Thought Leadership\n## Board Memberships & Advisory Roles\n## Notable Achievements & Key Skills\n## Industry Recognition & Awards\n## Known Controversies or Issues\n\nSearch thoroughly. Flag any discrepancies, gaps, or concerns.${liCtx}`;

  try {
    const r = await callClaude(
      [{ role: 'user', content: prompt }],
      { apiKey, model, stream: true, webSearch: true, maxTokens: 8192, signal, searchUses: 20 }
    );

    let fullMd = '';
    return await streamResponse(
      r,
      (chunk, acc) => { fullMd = acc; onText?.(chunk, acc); },
      (active, label) => onSearch?.(active, label || 'Researching professional background')
    );
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw e;
  }
}
