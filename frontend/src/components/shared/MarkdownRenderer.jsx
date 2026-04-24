import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Sanitize AI-generated markdown before insertion via innerHTML.
// Without this, prompt-injection payloads embedded in scraped content
// (e.g. a Glassdoor review containing "<img src=x onerror=...>") can
// execute arbitrary JS in the renderer and exfiltrate window.psgApp.localToken.
const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'strong', 'em', 'u', 's', 'sup', 'sub',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'code', 'pre', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'span', 'div',
];
const ALLOWED_ATTR = ['href', 'title', 'class', 'colspan', 'rowspan'];

function safeRender(content) {
  const parsed = marked.parse(content, { mangle: false, headerIds: false });
  return DOMPurify.sanitize(parsed, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // Strip javascript:, vbscript:, data: hrefs that DOMPurify doesn't
    // already block — belt-and-braces.
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  });
}

export default function MarkdownRenderer({ content, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && content) {
      try {
        ref.current.innerHTML = safeRender(content);
      } catch {
        // Fallback: plain-text rendering (already escaped via <).
        ref.current.innerHTML = content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      }
    } else if (ref.current) {
      ref.current.innerHTML = '';
    }
  }, [content]);

  return <div ref={ref} className={`psg-report-body ${className}`} />;
}
