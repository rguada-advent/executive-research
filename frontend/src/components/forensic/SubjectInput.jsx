import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';

export default function SubjectInput({ onStart }) {
  const { state, dispatch, toast } = useApp();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const leaders = state.leaders;

  function handleAdd() {
    if (!name.trim()) { toast('Enter a name.'); return; }
    if (!title.trim()) { toast('Enter a title.'); return; }
    dispatch({ type: 'ADD_LEADER', payload: { name: name.trim(), title: title.trim(), company: company.trim(), seniority: 'other' } });
    toast('Added: ' + name.trim());
    setName(''); setTitle(''); setCompany('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd();
  }

  function handleRemove(idx) {
    dispatch({ type: 'REMOVE_LEADER', payload: idx });
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true);
    try {
      let text = '';
      const ext = file.name.split('.').pop().toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(ext)) {
        const { read, utils } = await import('xlsx');
        const wb = read(await file.arrayBuffer());
        text = utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
      } else if (['docx', 'doc'].includes(ext)) {
        const mammoth = await import('mammoth');
        const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        text = r.value;
      } else if (ext === 'pdf') {
        const pdfjs = await new Promise((resolve, reject) => {
          if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
          s.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
            resolve(window.pdfjsLib);
          };
          s.onerror = () => reject(new Error('Failed to load PDF.js'));
          document.head.appendChild(s);
        });
        const pdf = await pdfjs.getDocument(await file.arrayBuffer()).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
      } else {
        text = await file.text();
      }

      const { callClaude } = await import('../../services/claudeApi');
      const prompt = `Extract people from this text. For each person return: name, title, company.\nReturn ONLY a valid JSON array: [{"name":"...","title":"...","company":"..."}]\n\nText:\n${text.slice(0, 25000)}`;
      const result = await callClaude([{ role: 'user', content: prompt }], { apiKey: state.apiKey, model: state.model });
      const match = result.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Could not parse response');
      const parsed = JSON.parse(match[0]);
      const people = parsed.filter(p => p.name).map(p => ({ name: p.name, title: p.title || 'Unknown', company: p.company || '', seniority: 'other' }));
      dispatch({ type: 'ADD_LEADERS', payload: people });
      toast(`Imported ${people.length} subjects.`);
    } catch (err) {
      toast('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-6 mb-4">
      <h2 className="text-base font-bold text-advent-navy flex items-center gap-2 mb-1">
        <span className="w-1 h-[18px] bg-advent-navy rounded" />
        Subjects for Investigation
      </h2>
      <p className="text-sm text-advent-gray-500 mb-4">
        Add executives for forensic background investigation. Each subject will be researched across professional history, social media, legal databases, regulatory filings, and verified by an adversarial agent.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-[11px] text-advent-gray-500 uppercase tracking-wide mb-1">Full Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. John Smith"
            className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] text-advent-gray-500 uppercase tracking-wide mb-1">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. SVP, Commercial Operations"
            className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] text-advent-gray-500 uppercase tracking-wide mb-1">Company</label>
          <input
            value={company}
            onChange={e => setCompany(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Pfizer"
            className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleAdd}
          className="bg-advent-navy text-white px-4 py-1.5 rounded text-sm font-semibold hover:opacity-90"
        >
          Add Subject
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="bg-advent-gray-200 border border-advent-gray-350 text-advent-gray-700 px-4 py-1.5 rounded text-sm font-medium hover:bg-advent-gray-350 disabled:opacity-50"
        >
          {importing ? 'Importing...' : 'Import from File'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.docx,.doc,.csv,.txt,.pdf"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      {leaders.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {leaders.map((l, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-advent-gray-75 border border-advent-gray-200 rounded-lg">
              <div className="flex-1 text-sm">
                <strong className="text-advent-gray-700">{l.name}</strong>
                <span className="text-advent-gray-500"> — {l.title}{l.company ? ' at ' + l.company : ''}</span>
              </div>
              <button
                onClick={() => handleRemove(i)}
                className="text-risk-high hover:text-risk-critical text-lg leading-none px-1"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-advent-gray-200">
        <button
          onClick={onStart}
          disabled={leaders.length === 0}
          className="bg-advent-navy text-white px-5 py-2 rounded text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start Investigation
        </button>
        <span className="text-sm text-advent-gray-500">
          {leaders.length} subject{leaders.length !== 1 ? 's' : ''} added
        </span>
      </div>
    </div>
  );
}
