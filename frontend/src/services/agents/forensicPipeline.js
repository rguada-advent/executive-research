import { agentProfessionalResearch } from './professionalResearch';
import { agentSocialMedia } from './socialMedia';
import { agentGlassdoor } from './glassdoor';
import { agentLegalResearch } from './legalResearch';
import { agentRegulatoryCompliance } from './regulatoryCompliance';
import { agentVerification } from './verification';
import { agentBriefSynthesizer } from './briefSynthesizer';
import { agentLinkedInResearch } from './linkedinResearch';

const RISK_ORDER = ['none', 'low', 'medium', 'high', 'critical'];
function maxRisk(a, b) {
  return RISK_ORDER.indexOf(a) > RISK_ORDER.indexOf(b) ? a : b;
}

async function withRetry(fn, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      if (attempt === maxRetries) throw err;
      // Exponential base backoff
      await new Promise(r => setTimeout(r, 1500 * Math.pow(2, attempt)));
      // Rate-limit specific extra wait: Anthropic's RPM window is 60s, so we
      // need to wait long enough for it to actually reset. Previous 5s was
      // inadequate and caused glassdoor/linkedin agents to exhaust retries
      // during the 60s rate-limit window.
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('rate') || msg.includes('429') || msg.includes('overloaded') || msg.includes('529')) {
        await new Promise(r => setTimeout(r, 15000 + (attempt * 10000)));
      }
    }
  }
}

export async function runForensicPipeline(leader, {
  signal, apiKey, model, clToken, onUpdate, onSearch,
} = {}) {
  const name = leader.name;

  // Tracked state for building pipe snapshot
  let pipeState = {
    professional: null, social: null,
    glassdoor: null, linkedin: null, legal: null,
    regulatory: null, verification: null, brief: null,
    completedAgents: [], failedAgents: [],
  };

  function markCompleted(agentId) {
    if (!pipeState.completedAgents.includes(agentId)) {
      pipeState.completedAgents = [...pipeState.completedAgents, agentId];
    }
    onUpdate?.(name, { completedAgents: [...pipeState.completedAgents] });
  }

  function markFailed(agentId, errorMsg) {
    if (!pipeState.failedAgents.includes(agentId)) {
      pipeState.failedAgents = [...pipeState.failedAgents, agentId];
    }
    const errors = { ...(pipeState.errors || {}) };
    if (errorMsg) errors[agentId] = errorMsg;
    pipeState.errors = errors;
    onUpdate?.(name, { failedAgents: [...pipeState.failedAgents], errors });
  }

  function update(data) {
    Object.assign(pipeState, data);
    onUpdate?.(name, data);
  }

  try {
    // Agent 1: Professional Research (required, streaming)
    update({ state: 'professional' });
    onSearch?.(true, 'Researching professional background');

    const professional = await withRetry(() =>
      agentProfessionalResearch(leader, {
        apiKey, model, signal,
        onText: (_, acc) => update({ professional: acc }),
        onSearch: (active, label) => onSearch?.(active, label),
        linkedInData: null,
      })
    );
    onSearch?.(false);
    update({ professional, state: 'social' });
    markCompleted(1);
    if (signal?.aborted) return;

    // Parallel agents: 3 (social), 13 (glassdoor), 10 (legal), 11 (regulatory), 12 (linkedin via web search)
    // Glassdoor and LinkedIn get maxRetries=2 because they're most prone to
    // Anthropic rate-limit rejections (heavy web-search prompts) and the
    // longer retry window gives them time to recover from a 60s RPM cap.
    const [sRes, gdRes, lRes, rRes, liRes] = await Promise.allSettled([
      withRetry(() => agentSocialMedia(leader, { apiKey, model, signal }), 1),
      withRetry(() => agentGlassdoor(leader, { apiKey, model, signal }), 2),
      withRetry(() => agentLegalResearch(leader, { apiKey, model, signal, clToken }), 1),
      withRetry(() => agentRegulatoryCompliance(leader, { apiKey, model, signal }), 1),
      withRetry(() => agentLinkedInResearch(leader, { apiKey, model, signal }), 2),
    ]);

    const social = sRes.status === 'fulfilled' ? sRes.value : null;
    const glassdoor = gdRes.status === 'fulfilled' ? gdRes.value : null;
    const legal = lRes.status === 'fulfilled' ? lRes.value : null;
    const regulatory = rRes.status === 'fulfilled' ? rRes.value : null;
    const linkedinResult = liRes.status === 'fulfilled' ? liRes.value : null;

    update({ social, glassdoor, legal, regulatory, linkedin: linkedinResult });

    if (sRes.status === 'fulfilled') markCompleted(3); else markFailed(3, sRes.reason?.message);
    if (gdRes.status === 'fulfilled') markCompleted(13); else markFailed(13, gdRes.reason?.message);
    if (lRes.status === 'fulfilled') markCompleted(10); else markFailed(10, lRes.reason?.message);
    if (rRes.status === 'fulfilled') markCompleted(11); else markFailed(11, rRes.reason?.message);
    if (liRes.status === 'fulfilled') markCompleted(12); else markFailed(12, liRes.reason?.message);

    if (signal?.aborted) return;

    // Compute overall risk
    const lRisk = legal?.overallLitigationRisk || 'none';
    const rRisk = regulatory?.overallRegulatoryRisk || 'none';
    const overallRisk = maxRisk(lRisk, rRisk);
    update({ overallRisk });

    // Agent 4: Verification (adversarial)
    update({ state: 'verification' });
    onSearch?.(true, 'Verifying facts');
    try {
      const pipeSnashot = { professional, social, glassdoor, legal, regulatory, linkedin: linkedinResult };
      const verification = await agentVerification(leader, pipeSnashot, { apiKey, model, signal });
      onSearch?.(false);
      update({ verification, overallConfidence: verification.overallConfidenceScore });
      markCompleted(4);
    } catch (err) {
      onSearch?.(false);
      if (err.name === 'AbortError') return;
      markFailed(4, err.message);
    }

    if (signal?.aborted) return;

    // Agent 5: Brief Synthesizer (required, streaming)
    update({ state: 'brief' });
    onSearch?.(true, 'Writing report');

    const briefPipe = { ...pipeState };
    let brief = await agentBriefSynthesizer(leader, briefPipe, {
      apiKey, model, signal, mode: 'forensic',
      onText: (_, acc) => update({ brief: acc }),
    });
    onSearch?.(false);

    // Defensive: if Claude returned an empty or nearly-empty stream,
    // don't silently claim success. Retry once, then either surface the
    // empty state to the UI or mark the stage failed with a helpful message.
    if (!brief || brief.trim().length < 200) {
      console.warn('[PSG] Brief synthesizer returned empty/short content, retrying once');
      try {
        brief = await agentBriefSynthesizer(leader, briefPipe, {
          apiKey, model, signal, mode: 'forensic',
          onText: (_, acc) => update({ brief: acc }),
        });
      } catch (retryErr) {
        if (retryErr.name === 'AbortError') throw retryErr;
        markFailed(5, 'Brief generation failed: ' + (retryErr.message || 'empty response'));
        update({ state: 'failed' });
        return;
      }
      if (!brief || brief.trim().length < 200) {
        markFailed(5, 'Brief generation returned empty content. This usually indicates an API rate limit or a content-filter response — wait a minute and try again.');
        update({ state: 'failed' });
        return;
      }
    }

    update({ brief, state: 'complete' });
    markCompleted(5);
  } catch (err) {
    onSearch?.(false);
    if (err.name === 'AbortError') {
      update({ state: 'aborted' });
      return;
    }
    update({ state: 'failed' });
    throw err;
  }
}
