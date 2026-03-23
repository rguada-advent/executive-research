import { useCallback } from 'react';

export default function ExportButton({ targetRef, filename = 'export', label = 'Export PDF' }) {
  const handleExport = useCallback(async () => {
    if (!targetRef?.current) return;
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf(targetRef.current, {
        margin: [10, 10],
        filename: `${filename.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4' },
      });
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  }, [targetRef, filename]);

  return (
    <button onClick={handleExport} className="bg-advent-blue text-white px-4 py-1.5 rounded text-sm font-semibold hover:opacity-90">
      {label}
    </button>
  );
}
