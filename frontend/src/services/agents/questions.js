import { callClaude, streamResponse } from '../claudeApi';

export async function agentQuestions(leader, pipe, { apiKey, model, signal, onText, specText }) {
  const company = leader.company ? ' at ' + leader.company : '';
  const scoring = pipe.scoring;

  const prompt = `Senior executive recruiter preparing screening call with ${leader.name}, ${leader.title}${company}. Questions must be SURGICAL.\n\n=== PROFILE ===\n${(pipe.brief || '').slice(0, 15000)}\n\n=== SCORING ===\n${scoring ? JSON.stringify({ overall: scoring.overall, label: scoring.label, gaps: scoring.gaps, strengths: scoring.strengths }, null, 2) : 'No scoring'}\n\n=== SPEC ===\n${(specText || '').slice(0, 10000)}\n\nGenerate markdown questions with green/red flag indicators:\n\n# Screening Questions: ${leader.name}\n\n## Spec-Critical Questions (5-7)\n## Leadership & Culture (3-4)\n## Behavioral / Situational (3-4)\n## Motivation & Logistics (3-4)\n\nAfter each question add:\n- *Probing: [what]*\n- *Green flag: [good answer]*\n- *Red flag: [concern]*`;

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
