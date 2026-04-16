import { useCallback, useState } from 'react';

/**
 * Walks a cloned DOM subtree and sanitizes any CSS color that html2canvas
 * cannot parse (oklch, oklab, color-mix, color(), lab, lch). Tailwind v4
 * emits these for arbitrary-opacity utilities like `bg-[#0a66c2]/5`.
 *
 * Strategy: for every element whose computed style contains an unsupported
 * color function, resolve the computed value in the LIVE document (where
 * the browser renders it as rgb()/rgba()) and inline that rgba value on the
 * cloned element. This is run inside html2canvas's `onclone` hook.
 */
function sanitizeColorsForCanvas(clonedDoc, liveRoot) {
  if (!clonedDoc || !liveRoot) return;
  const UNSUPPORTED = /(oklch|oklab|color-mix|color\(|\blab\(|\blch\()/i;
  const COLOR_PROPS = [
    'color', 'backgroundColor', 'borderTopColor', 'borderRightColor',
    'borderBottomColor', 'borderLeftColor', 'outlineColor',
    'textDecorationColor', 'fill', 'stroke', 'caretColor',
    'columnRuleColor', 'boxShadow',
  ];

  const liveElements = liveRoot.querySelectorAll('*');
  const clonedElements = clonedDoc.querySelectorAll('[data-psg-export-root] *');

  // Match by index since we cloned the same tree
  const count = Math.min(liveElements.length, clonedElements.length);
  for (let i = 0; i < count; i++) {
    const live = liveElements[i];
    const cloned = clonedElements[i];
    const computed = window.getComputedStyle(live);
    for (const prop of COLOR_PROPS) {
      const val = computed[prop];
      if (val && UNSUPPORTED.test(val)) {
        try { cloned.style[prop] = val; } catch (_) {}
      } else if (val) {
        // Always copy resolved rgb/rgba values so the clone doesn't rely on
        // any stylesheet rule that might itself contain unsupported syntax.
        try { cloned.style[prop] = val; } catch (_) {}
      }
    }
  }
}

export default function ExportButton({ targetRef, filename = 'export', label = 'Export PDF' }) {
  const [busy, setBusy] = useState(false);

  const handleExport = useCallback(async () => {
    if (!targetRef?.current) return;
    setBusy(true);

    // Tag the live root so the onclone hook can find its cloned counterpart.
    const liveRoot = targetRef.current;
    const flagAdded = !liveRoot.hasAttribute('data-psg-export-root');
    if (flagAdded) liveRoot.setAttribute('data-psg-export-root', '1');

    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf().from(liveRoot).set({
        margin: [10, 10],
        filename: `${filename.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => sanitizeColorsForCanvas(clonedDoc, liveRoot),
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }).save();
    } catch (err) {
      console.error('PDF export failed, falling back to print dialog:', err);
      // Graceful fallback: browser print dialog renders modern CSS natively.
      try {
        window.print();
      } catch (printErr) {
        // Last-resort user notification, no alert spam.
        console.error('Print fallback also failed:', printErr);
      }
    } finally {
      if (flagAdded) liveRoot.removeAttribute('data-psg-export-root');
      setBusy(false);
    }
  }, [targetRef, filename]);

  return (
    <button
      onClick={handleExport}
      disabled={busy}
      className="psg-btn psg-btn-primary"
    >
      {busy ? (
        <>
          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Exporting…
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
