// All Claude API calls are proxied through the local Flask backend at localhost:5001.
// The Anthropic API key lives only on the backend side — never in the browser.
const BACKEND_BASE = window.psgApp?.isElectron
  ? 'http://127.0.0.1:5001'
  : '/api';

const SYSTEM_PROMPTS = {
  forensic: 'You are a forensic background intelligence analyst. Be thorough, skeptical, and precise. Cite sources for every claim. Flag any concerns immediately.',
  talent: 'You are an executive talent intelligence analyst for a top-tier executive search firm. Be thorough, accurate, and insightful. Never fabricate information.',
};

// Per-session auth token injected by the Electron preload via contextBridge.
// Must be included in every Flask API request so the backend enforces
// that only the Electron renderer (not other local processes) can call it.
function localAuthHeaders() {
  const token = window.psgApp?.localToken;
  return token ? { 'X-PSG-Local-Token': token } : {};
}

export async function callClaude(messages, {
  apiKey,           // kept in signature for backward compat with 20+ call sites — not used
  model = 'claude-sonnet-4-6', stream = false,
  webSearch = false, maxTokens = 16384, signal,
  searchUses = 10, system, mode = 'forensic',
} = {}) {
  const headers = { 'Content-Type': 'application/json', ...localAuthHeaders() };
  if (webSearch) headers['anthropic-beta'] = 'web-search-2025-03-05';

  const body = {
    model,
    max_tokens: maxTokens,
    system: system || SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.forensic,
    messages,
  };
  if (webSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: searchUses }];
  }
  if (stream) body.stream = true;

  const r = await fetch(`${BACKEND_BASE}/claude/messages`, {
    method: 'POST', headers, body: JSON.stringify(body), signal,
  });

  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error?.message || e.error || `API error ${r.status}`);
  }

  if (stream) return r;
  const data = await r.json();
  return data.content.filter(c => c.type === 'text').map(c => c.text).join('');
}

export async function streamResponse(response, onText, onSearch) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '', full = '', blockType = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split('\n\n');
      buf = parts.pop();

      for (const part of parts) {
        for (const line of part.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (raw === '[DONE]') return full;
          let d;
          try { d = JSON.parse(raw); } catch { continue; }

          if (d.type === 'content_block_start') {
            blockType = d.content_block?.type;
            if (blockType === 'server_tool_use') onSearch?.(true, d.content_block?.name);
          } else if (d.type === 'content_block_delta' && d.delta?.type === 'text_delta') {
            full += d.delta.text;
            onText?.(d.delta.text, full);
          } else if (d.type === 'content_block_stop' && blockType === 'server_tool_use') {
            onSearch?.(false);
            blockType = null;
          }
        }
      }
    }
  } catch (e) {
    if (e.name === 'AbortError') { onSearch?.(false); return full; }
    throw e;
  }
  return full;
}
