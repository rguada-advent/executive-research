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
    <div className="psg-card p-8 mb-4 psg-fade-up">
      {/* Hero heading */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 bg-advent-gold rotate-45" aria-hidden />
          <span className="text-[11px] font-semibold tracking-[0.15em] text-advent-gray-500 uppercase">Forensic Intelligence</span>
        </div>
        <h2 className="text-2xl font-bold text-advent-navy tracking-tight">Executive Research</h2>
        <p className="text-sm text-advent-gray-500 mt-2 max-w-2xl leading-relaxed">
          Add executives for deep background investigation. Each subject is researched across
          professional history, social media, legal databases, and regulatory filings — then
          verified by an adversarial agent for confidence scoring.
        </p>
      </div>

      {/* Input grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="psg-label">Full Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. John Smith"
            className="psg-input"
          />
        </div>
        <div>
          <label className="psg-label">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="SVP, Commercial Operations"
            className="psg-input"
          />
        </div>
        <div>
          <label className="psg-label">Company</label>
          <input
            value={company}
            onChange={e => setCompany(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pfizer"
            className="psg-input"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <button onClick={handleAdd} className="psg-btn psg-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Add Subject
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="psg-btn psg-btn-secondary"
        >
          {importing ? (
            <><span className="w-3 h-3 border-2 border-advent-navy/30 border-t-advent-navy rounded-full animate-spin" /> Importing…</>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import from File
            </>
          )}
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
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-advent-gray-500">Subjects Queue</span>
            <span className="text-[11px] text-advent-gray-500">{leaders.length} {leaders.length === 1 ? 'subject' : 'subjects'}</span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
            {leaders.map((l, i) => (
              <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 bg-advent-gray-75 border border-[var(--border-subtle)] rounded-lg hover:border-[var(--border-default)] transition-colors">
                <span className="w-7 h-7 rounded-full bg-advent-navy text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                  {l.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <div className="flex-1 min-w-0 text-sm">
                  <div className="font-semibold text-advent-navy truncate">{l.name}</div>
                  <div className="text-[12px] text-advent-gray-500 truncate">{l.title}{l.company ? ` · ${l.company}` : ''}</div>
                </div>
                <button
                  onClick={() => handleRemove(i)}
                  className="text-advent-gray-350 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                  aria-label={`Remove ${l.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 pt-5 border-t border-[var(--border-subtle)]">
        <button
          onClick={onStart}
          disabled={leaders.length === 0}
          className="psg-btn psg-btn-primary"
        >
          Start Investigation
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
        <span className="text-sm text-advent-gray-500">
          {leaders.length === 0 ? 'Add at least one subject to begin' : `Ready to research ${leaders.length} ${leaders.length === 1 ? 'subject' : 'subjects'}`}
        </span>
      </div>
    </div>
  );
}
