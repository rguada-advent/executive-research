# Remove Contact & Education Gathering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all contact information gathering and educational history gathering from both the Forensic and Talent pipelines, leaving the rest of the research pipeline intact.

**Architecture:** Contact intelligence runs as a discrete agent (Agent 2) called from both `TalentView.jsx` and `forensicPipeline.js`. Education data is embedded in three agent prompts (`professionalResearch`, `talentResearch`, `verification`) and in the synthesizer's output template. We surgically remove both concerns at their source — agents, pipelines, and UI references — without touching unrelated pipeline stages.

**Tech Stack:** React (Vite), plain JavaScript, no test suite currently wired up.

---

## File Map

### Files to DELETE
- `frontend/src/services/agents/contactIntelligence.js` — entire agent is contact-only

### Files to MODIFY

| File | What Changes |
|------|-------------|
| `frontend/src/services/agents/forensicPipeline.js` | Remove Agent 2 import, call, state key, and snapshot reference |
| `frontend/src/services/agents/verification.js` | Remove contact data block from prompt; remove education task and `education` from confidenceBreakdown |
| `frontend/src/services/agents/briefSynthesizer.js` | Remove `contactBlock`, `## Contact Information`, `## Education & Credentials` from prompt template |
| `frontend/src/services/agents/professionalResearch.js` | Remove `## Education (verify degrees)` from prompt |
| `frontend/src/services/agents/talentResearch.js` | Remove education field from prompt, JSON template, and defaults |
| `frontend/src/components/talent/TalentView.jsx` | Remove Agent 2 import, execution block, and `## Education` section from briefText |
| `frontend/src/utils/constants.js` | Remove `contact` stage from both `FORENSIC_PIPELINE_STAGES` and `TALENT_PIPELINE_STAGES` |

---

## Task 1: Delete `contactIntelligence.js`

**Files:**
- Delete: `frontend/src/services/agents/contactIntelligence.js`

- [ ] **Step 1: Verify no other callers remain (two known: TalentView, forensicPipeline — both removed in later tasks)**

```bash
grep -r "contactIntelligence" frontend/src --include="*.js" --include="*.jsx" -l
```
Expected output: `contactIntelligence.js`, `forensicPipeline.js`, `TalentView.jsx`

- [ ] **Step 2: Delete the file**

```bash
rm frontend/src/services/agents/contactIntelligence.js
```

- [ ] **Step 3: Confirm deletion**

```bash
ls frontend/src/services/agents/
```
Expected: `contactIntelligence.js` is absent from the listing.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: delete contactIntelligence agent"
```

---

## Task 2: Remove contact from `forensicPipeline.js`

**Files:**
- Modify: `frontend/src/services/agents/forensicPipeline.js`

Four changes in this file:

### Change A — Remove import (line 2)

- [ ] **Step 1: Remove the import**

Find:
```js
import { agentContactIntelligence } from './contactIntelligence';
```
Delete that line entirely.

### Change B — Remove `contact` from pipeState (line 43)

- [ ] **Step 2: Remove `contact` from the tracked state object**

Find:
```js
  let pipeState = {
    professional: null, contact: null, social: null,
```
Replace with:
```js
  let pipeState = {
    professional: null, social: null,
```

### Change C — Remove contact agent from parallel execution (lines 86–117)

- [ ] **Step 3: Remove Agent 2 from the `Promise.allSettled` array and its result handling**

Find:
```js
    update({ professional, state: 'contact' });
    markCompleted(1);
    if (signal?.aborted) return;

    // Parallel agents: 2 (contact), 3 (social), 13 (glassdoor), 10 (legal), 11 (regulatory), 12 (linkedin via web search)
    // Glassdoor and LinkedIn get maxRetries=2 because they're most prone to
    // Anthropic rate-limit rejections (heavy web-search prompts) and the
    // longer retry window gives them time to recover from a 60s RPM cap.
    const [cRes, sRes, gdRes, lRes, rRes, liRes] = await Promise.allSettled([
      withRetry(() => agentContactIntelligence(leader, { apiKey, model, signal }), 1),
      withRetry(() => agentSocialMedia(leader, { apiKey, model, signal }), 1),
      withRetry(() => agentGlassdoor(leader, { apiKey, model, signal }), 2),
      withRetry(() => agentLegalResearch(leader, { apiKey, model, signal, clToken }), 1),
      withRetry(() => agentRegulatoryCompliance(leader, { apiKey, model, signal }), 1),
      withRetry(() => agentLinkedInResearch(leader, { apiKey, model, signal }), 2),
    ]);

    const contact = cRes.status === 'fulfilled' ? cRes.value : null;
    const social = sRes.status === 'fulfilled' ? sRes.value : null;
    const glassdoor = gdRes.status === 'fulfilled' ? gdRes.value : null;
    const legal = lRes.status === 'fulfilled' ? lRes.value : null;
    const regulatory = rRes.status === 'fulfilled' ? rRes.value : null;
    const linkedinResult = liRes.status === 'fulfilled' ? liRes.value : null;

    update({ contact, social, glassdoor, legal, regulatory, linkedin: linkedinResult });

    if (cRes.status === 'fulfilled') markCompleted(2); else markFailed(2, cRes.reason?.message);
    if (sRes.status === 'fulfilled') markCompleted(3); else markFailed(3, sRes.reason?.message);
    if (gdRes.status === 'fulfilled') markCompleted(13); else markFailed(13, gdRes.reason?.message);
    if (lRes.status === 'fulfilled') markCompleted(10); else markFailed(10, lRes.reason?.message);
    if (rRes.status === 'fulfilled') markCompleted(11); else markFailed(11, rRes.reason?.message);
    if (liRes.status === 'fulfilled') markCompleted(12); else markFailed(12, liRes.reason?.message);
```

Replace with:
```js
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
```

### Change D — Remove `contact` from verification pipe snapshot (line 131)

- [ ] **Step 4: Remove `contact` from the pipe snapshot passed to `agentVerification`**

Find:
```js
      const pipeSnashot = { professional, contact, social, glassdoor, legal, regulatory, linkedin: linkedinResult };
```
Replace with:
```js
      const pipeSnashot = { professional, social, glassdoor, legal, regulatory, linkedin: linkedinResult };
```

- [ ] **Step 5: Verify the file has no remaining references to `contact` or `contactIntelligence`**

```bash
grep -n "contact\|contactIntelligence" frontend/src/services/agents/forensicPipeline.js
```
Expected: no output (or only comments).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/agents/forensicPipeline.js
git commit -m "feat: remove contact intelligence from forensic pipeline"
```

---

## Task 3: Remove contact & education from `verification.js`

**Files:**
- Modify: `frontend/src/services/agents/verification.js`

Three changes:

### Change A — Remove `contactData` variable and its prompt section

- [ ] **Step 1: Remove `contactData` variable (line 6)**

Find:
```js
  const contactData = pipe.contact ? JSON.stringify(pipe.contact) : 'No contact data';
```
Delete that line entirely.

- [ ] **Step 2: Remove the contact section from the prompt**

Find:
```js
=== CONTACT ===
${(contactData || '').slice(0, 3000)}

```
Delete those three lines entirely (including the blank line after).

### Change B — Remove education from TASKS

- [ ] **Step 3: Remove task 4 from the TASKS list**

Find:
```
4. Verify: degrees claimed, board seats, certifications
```
Delete that line. Renumber remaining tasks if needed (task 5 becomes task 4, task 6 becomes task 5).

After removal, the TASKS block should read:
```
TASKS:
1. Verify identity: Is this the SAME person across all sources?
2. Cross-validate: Do dates, titles, companies match across sources?
3. Search for: "${leader.name}" + "fraud"/"scandal"/"fired"/"controversy"
4. Flag: Any contradictions between data sources
5. Assign confidence: VERIFIED/LIKELY/UNVERIFIED/CONTRADICTED/NOT_FOUND
```

### Change C — Remove `education` and `contactInfo` from `confidenceBreakdown`

- [ ] **Step 4: Remove `education` and `contactInfo` fields from the JSON template in the prompt**

Find (within the long JSON template string):
```
"education":"UNVERIFIED","achievements":"LIKELY","contactInfo":"MIXED",
```
Replace with:
```
"achievements":"LIKELY",
```

- [ ] **Step 5: Verify**

```bash
grep -n "contact\|education\|degree" frontend/src/services/agents/verification.js
```
Expected: no matches (or only in innocuous context such as comments).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/agents/verification.js
git commit -m "feat: remove contact and education from verification agent"
```

---

## Task 4: Remove contact & education from `briefSynthesizer.js`

**Files:**
- Modify: `frontend/src/services/agents/briefSynthesizer.js`

Three changes:

### Change A — Remove `contactBlock`

- [ ] **Step 1: Delete the contactBlock variable (lines 64–66)**

Find:
```js
  const contactBlock = pipe.contact
    ? '\n=== CONTACT DATA ===\n' + JSON.stringify(pipe.contact, null, 2).slice(0, 5000)
    : '';
```
Delete those three lines entirely.

### Change B — Remove contactBlock from prompt and `## Contact Information` from template

- [ ] **Step 2: Remove `contactBlock` from the prompt string**

Find (within the long template literal on line 88):
```
- Include ALL contact info and social profiles\n
```
Replace with:
```
- Include social profiles\n
```

Find (also within the template literal):
```
${contactBlock}\n
```
Delete that line.

- [ ] **Step 3: Remove `## Contact Information` from the markdown format template**

Find (within the template literal):
```
## Contact Information\n
```
Delete that line.

### Change C — Remove `## Education & Credentials` from template

- [ ] **Step 4: Remove the Education section header from the markdown format template**

Find (within the template literal):
```
## Education & Credentials\n
```
Delete that line.

- [ ] **Step 5: Verify**

```bash
grep -n "contact\|education\|Education\|Contact" frontend/src/services/agents/briefSynthesizer.js
```
Expected: no matches (LinkedIn/social references are fine to keep).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/agents/briefSynthesizer.js
git commit -m "feat: remove contact and education sections from brief synthesizer"
```

---

## Task 5: Remove education from `professionalResearch.js`

**Files:**
- Modify: `frontend/src/services/agents/professionalResearch.js`

- [ ] **Step 1: Remove the Education section from the prompt**

Find (within the prompt template string on line 11):
```
## Education (verify degrees)\n
```
Delete that line.

- [ ] **Step 2: Verify**

```bash
grep -n "education\|Education\|degree\|Degree" frontend/src/services/agents/professionalResearch.js
```
Expected: no matches.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/agents/professionalResearch.js
git commit -m "feat: remove education from professional research prompt"
```

---

## Task 6: Remove education from `talentResearch.js`

**Files:**
- Modify: `frontend/src/services/agents/talentResearch.js`

Three changes:

### Change A — Remove education from FOCUS ON

- [ ] **Step 1: Remove education line from the FOCUS ON block**

Find:
```
- Education: highest degree only
```
Delete that line.

### Change B — Remove education from JSON template

- [ ] **Step 2: Remove the `education` field from the JSON template**

Find:
```js
  "education": "...",
```
Delete that line.

### Change C — Remove education from defaults

- [ ] **Step 3: Remove `education` from the `defaults` object**

Find:
```js
  const defaults = {
    linkedinUrl: '', currentRole: null, previousRole: null,
    education: '', location: '', summary: '', profileFound: false,
  };
```
Replace with:
```js
  const defaults = {
    linkedinUrl: '', currentRole: null, previousRole: null,
    location: '', summary: '', profileFound: false,
  };
```

- [ ] **Step 4: Verify**

```bash
grep -n "education\|Education\|degree\|Degree" frontend/src/services/agents/talentResearch.js
```
Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/agents/talentResearch.js
git commit -m "feat: remove education from talent research agent"
```

---

## Task 7: Remove contact & education from `TalentView.jsx`

**Files:**
- Modify: `frontend/src/components/talent/TalentView.jsx`

Three changes:

### Change A — Remove import

- [ ] **Step 1: Remove the contactIntelligence import (line 12)**

Find:
```js
import { agentContactIntelligence } from '../../services/agents/contactIntelligence';
```
Delete that line entirely.

### Change B — Remove Agent 2 execution block (lines 95–124)

- [ ] **Step 2: Remove the entire Agent 2 block**

Find:
```js
      // Agent 2: Contact Intelligence (parallel, non-blocking)
      dispatch({ type: 'UPDATE_PIPELINE', payload: { name: leader.name, data: { state: 'contact' } } });
      setSearchLabel('Finding contact information');

      try {
        const contact = await agentContactIntelligence(leader, {
          apiKey: state.apiKey,
          model: state.model,
          signal: ctrl.signal,
        });
        dispatch({
          type: 'UPDATE_PIPELINE',
          payload: { name: leader.name, data: { contact, completedAgents: [1, 2] } },
        });

        // Append contact info to brief
        if (contact && (contact.professionalEmails?.length || contact.phones?.length)) {
          const contactSection = '\n\n## Contact Information\n' +
            (contact.professionalEmails || []).map(e => `- Email: ${e.email} [${e.type || 'unknown'}] (${e.confidence || 'low'})`).join('\n') +
            ((contact.phones || []).length ? '\n' + contact.phones.map(p => `- Phone: ${p.number} [${p.type || 'unknown'}]`).join('\n') : '') +
            (contact.officeAddress?.address ? `\n- Office: ${contact.officeAddress.address}` : '');
          dispatch({
            type: 'UPDATE_PIPELINE',
            payload: { name: leader.name, data: { brief: briefText + contactSection } },
          });
        }
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        console.warn('Contact agent failed:', err.message);
      }
```
Delete that entire block.

### Change C — Remove `## Education` from briefText construction

- [ ] **Step 3: Remove the education line from the briefText template string (line 79)**

Find:
```js
          `## Education\n${research.education || 'Not found.'}\n\n` +
```
Delete that line.

- [ ] **Step 4: Update `completedAgents` to only reference agent 1 (it already is after the previous removal — verify)**

```bash
grep -n "completedAgents" frontend/src/components/talent/TalentView.jsx
```
Confirm the only remaining reference is `completedAgents: [1]`.

- [ ] **Step 5: Verify no remaining contact or education references**

```bash
grep -n "contact\|Contact\|education\|Education" frontend/src/components/talent/TalentView.jsx
```
Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/talent/TalentView.jsx
git commit -m "feat: remove contact agent and education section from talent view"
```

---

## Task 8: Remove `contact` stage from pipeline stage constants

**Files:**
- Modify: `frontend/src/utils/constants.js`

- [ ] **Step 1: Remove `contact` from `FORENSIC_PIPELINE_STAGES`**

Find:
```js
  { id: 'contact', agent: 2, label: 'Contact', required: false },
```
Delete that line (it appears inside `FORENSIC_PIPELINE_STAGES`).

- [ ] **Step 2: Remove `contact` from `TALENT_PIPELINE_STAGES`**

Find:
```js
  { id: 'contact',       agent: 2,  label: 'Contact',    required: false },
```
Delete that line (it appears inside `TALENT_PIPELINE_STAGES`).

- [ ] **Step 3: Verify**

```bash
grep -n "contact" frontend/src/utils/constants.js
```
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/utils/constants.js
git commit -m "feat: remove contact pipeline stage from constants"
```

---

## Task 9: Smoke-Test Both Pipelines

- [ ] **Step 1: Start the dev server**

```bash
cd frontend && npm run dev
```

- [ ] **Step 2: Test Forensic pipeline**
  - Open the app in a browser
  - Navigate to Forensic mode
  - Add a test subject (e.g., "Tim Cook, CEO at Apple")
  - Run investigation
  - Confirm the pipeline tracker no longer shows a "Contact" stage
  - Confirm the generated report has no "Contact Information" or "Education & Credentials" sections

- [ ] **Step 3: Test Talent pipeline**
  - Navigate to Talent mode
  - Add a test executive
  - Run research
  - Confirm the pipeline tracker no longer shows a "Contact" stage
  - Confirm the profile tab shows no "Education" or "Contact Information" sections

- [ ] **Step 4: Confirm no console errors related to removed features**

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: smoke-tested contact and education removal across both pipelines"
```

---

## Summary of Changes

| Feature Removed | Files Affected |
|----------------|----------------|
| Contact Intelligence Agent | `contactIntelligence.js` (deleted), `forensicPipeline.js`, `TalentView.jsx`, `verification.js`, `briefSynthesizer.js`, `constants.js` |
| Educational History Gathering | `professionalResearch.js`, `talentResearch.js`, `verification.js`, `briefSynthesizer.js`, `TalentView.jsx` |
