import { useEffect, useRef } from 'react';
import { marked } from 'marked';

export default function MarkdownRenderer({ content, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && content) {
      try {
        ref.current.innerHTML = marked.parse(content);
      } catch {
        ref.current.innerHTML = content.replace(/</g, '&lt;').replace(/\n/g, '<br>');
      }
    } else if (ref.current) {
      ref.current.innerHTML = '';
    }
  }, [content]);

  return <div ref={ref} className={`prose prose-sm max-w-none ${className}`} />;
}
