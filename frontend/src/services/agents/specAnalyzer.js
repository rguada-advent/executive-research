import { callClaude } from '../claudeApi';

export async function agentSpecAnalyzer(specText, calibrationCtx, { apiKey, model }) {
  const prompt = `You are an expert recruiting specification analyst. Deconstruct this job description into structured requirements.\n\n${calibrationCtx ? 'SENIORITY CALIBRATION:\n' + calibrationCtx + '\n' : ''}\n=== RECRUITING SPECIFICATION ===\n${specText.slice(0, 30000)}\n\nReturn ONLY valid JSON:\n{"roleSummary":"...","mustHave":[{"requirement":"...","category":"leadership|industry|functional|education|geographic|compensation","searchHints":["..."]}],"niceToHave":[{"requirement":"...","category":"...","searchHints":["..."]}],"redFlags":["..."],"industryContext":["..."],"targetCompanies":["..."],"seniorityMapping":{"equivalent_titles":["..."],"calibration_notes":"..."},"keyQuestionAreas":["..."],"evaluationWeights":{"leadership":1.0,"industry":1.0,"functional":1.0,"education":0.5,"trackRecord":1.0,"culture":0.8,"governance":0.5,"network":0.6,"geographic":0.3,"compensation":0.7}}`;

  const result = await callClaude(
    [{ role: 'user', content: prompt }],
    { apiKey, model, maxTokens: 4096 }
  );

  const match = result.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse spec analysis');
  return JSON.parse(match[0]);
}
