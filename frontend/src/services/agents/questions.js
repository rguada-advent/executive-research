import { callClaude, streamResponse } from '../claudeApi';

export async function agentQuestions(leader, pipe, { apiKey, model, signal, onText, specText }) {
  const company = leader.company ? ' at ' + leader.company : '';

  const prompt = `Preparing a management due diligence discussion guide for ${leader.name}, ${leader.title}${company}. Questions must be specific and grounded in the public record.\n\n=== PROFILE ===\n${(pipe.brief || '').slice(0, 15000)}\n\n=== MANAGEMENT CRITERIA ===\n${(specText || '').slice(0, 10000)}\n\nGenerate markdown questions organized by theme:\n\n# Management Discussion Guide: ${leader.name}\n\n## Criteria-Specific Questions (5-7)\n## Leadership & Operating Experience (3-4)\n## Behavioral / Situational (3-4)\n## Strategic Orientation & Logistics (3-4)\n\nAfter each question add:\n- *Probing: [follow-up if answer is vague]*\n- *Depth indicator: [what a thorough answer includes]*`;

  const r = await callClaude(
    [{ role: 'user', content: prompt }],
    { apiKey, model, stream: true, maxTokens: 8192, signal }
  );

  let fullMd = '';
  return await streamResponse(
    r,
    (chunk, acc) => { fullMd = acc; onText?.(chunk, acc); },
    () => {}
  );
}
