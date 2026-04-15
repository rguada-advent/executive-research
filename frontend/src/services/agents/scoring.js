import { callClaude } from '../claudeApi';

export async function agentScoring(leader, pipe, { apiKey, model, signal, specText, specAnalysis, calibrationCtx }) {
  const briefMd = pipe.brief || '';
  const company = leader.company ? ' at ' + leader.company : '';
  const calBlock = calibrationCtx ? '\n=== SENIORITY CALIBRATION ===\n' + calibrationCtx + '\n' : '';

  let specWeights = '';
  if (specAnalysis?.evaluationWeights) {
    specWeights = '\n=== EVALUATION WEIGHTS ===\n' +
      Object.entries(specAnalysis.evaluationWeights).map(([k, v]) => '- ' + k + ': ' + v).join('\n');
  }

  const prompt = `You are an expert executive recruiter evaluator. Score ${leader.name}, ${leader.title}${company}.\n${calBlock}${specWeights}\n\n=== CANDIDATE PROFILE (FULL) ===\n${briefMd}\n\n=== RECRUITING SPECIFICATION ===\n${(specText || '').slice(0, 15000)}\n\n${specAnalysis ? '=== SPEC REQUIREMENTS ===\nMust-Have: ' + specAnalysis.mustHave.map(r => r.requirement).join('; ') : ''}\n\nReturn ONLY valid JSON:\n{"overall":3.5,"label":"Partial Match","dataQualityWarning":"","criteria":[{"name":"Leadership & Executive Experience","score":3.5,"rationale":"...","evidenceConfidence":"high|medium|low"},{"name":"Industry & Sector Alignment","score":3.5,"rationale":"...","evidenceConfidence":"..."},{"name":"Functional / Technical Expertise","score":3.5,"rationale":"...","evidenceConfidence":"..."},{"name":"Education & Credentials","score":3.5,"rationale":"...","evidenceConfidence":"..."},{"name":"Track Record & Achievements","score":3.5,"rationale":"...","evidenceConfidence":"..."},{"name":"Cultural & Leadership Style Fit","score":3.5,"rationale":"...","evidenceConfidence":"..."},{"name":"Board & Governance Experience","score":3.5,"rationale":"...","evidenceConfidence":"..."},{"name":"Network, Reputation & Thought Leadership","score":3.5,"rationale":"...","evidenceConfidence":"..."},{"name":"Geographic & Logistical Fit","score":3.5,"rationale":"...","evidenceConfidence":"..."},{"name":"Compensation & Level Alignment","score":3.5,"rationale":"...","evidenceConfidence":"..."}],"strengths":["..."],"gaps":["..."],"recommendation":"..."}\n\nScoring: 1=No experience, 2=Significant gaps, 3=Partial match, 4=Strong match, 5=Exceptional\nUse these labels: score>=4 → "Strong Match Indicators", score>=3 → "Partial Match", score<3 → "Limited Match Indicators"`;

  const result = await callClaude(
    [{ role: 'user', content: prompt }],
    { apiKey, model, maxTokens: 4096, signal }
  );

  const match = result.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse scoring');
  return JSON.parse(match[0]);
}
