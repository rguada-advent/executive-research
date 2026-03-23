import { callClaude } from '../claudeApi';

export async function agentSocialMedia(leader, { apiKey, model, signal }) {
  const company = leader.company ? ' at ' + leader.company : '';

  const prompt = `You are a digital footprint analyst conducting forensic social media research. Search for ${leader.name}, ${leader.title}${company} on each platform INDIVIDUALLY. Verify accounts match the correct person.\n\nSearch: LinkedIn, Twitter/X, Facebook, Instagram, TikTok, Reddit, YouTube, GitHub, Medium, Substack, Personal Website, Crunchbase, Podcast appearances, Speaking engagements, Media interviews/quotes.\n\nFor each platform found, note:\n- Content themes and frequency\n- Any controversial posts or statements\n- Network/connections of note\n- Account creation date if visible\n\nReturn ONLY valid JSON:\n{"profiles":{"linkedin":{"url":null,"headline":"","verified":false,"confidence":"low"},"twitter":{"handle":null,"url":null,"bio":"","recentTopics":[],"controversialPosts":[],"confidence":"low"},"facebook":{"url":null,"privacy":"public|private|unknown"},"instagram":{"handle":null},"github":{"url":null},"youtube":{"url":null,"appearances":[]},"medium":{"url":null},"substack":{"url":null},"personalWebsite":{"url":null},"crunchbase":{"url":null}},"podcastAppearances":[],"speakingEngagements":[],"mediaQuotes":[],"controversialContent":[]}`;

  try {
    const result = await callClaude(
      [{ role: 'user', content: prompt }],
      { apiKey, model, webSearch: true, maxTokens: 4096, signal, searchUses: 10 }
    );

    const match = result.match(/\{[\s\S]*\}/);
    if (!match) return { profiles: {}, podcastAppearances: [], speakingEngagements: [], mediaQuotes: [], controversialContent: [] };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { profiles: {}, podcastAppearances: [], speakingEngagements: [], mediaQuotes: [], controversialContent: [] };
    }
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return { profiles: {}, podcastAppearances: [], speakingEngagements: [], mediaQuotes: [], controversialContent: [] };
  }
}
