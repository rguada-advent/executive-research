import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { callClaude } from '../../services/claudeApi';

async function loadPdfjsFromCdn() {
  if (window.pdfjsLib) return window.pdfjsLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
}

async function parseFileContent(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    const { read, utils } = await import('xlsx');
    const wb = read(await file.arrayBuffer());
    return utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
  }
  if (['docx', 'doc'].includes(ext)) {
    const mammoth = await import('mammoth');
    const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return r.value;
  }
  if (ext === 'pdf') {
    const pdfjsLib = await loadPdfjsFromCdn();
    const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  }
  if (ext === 'txt') return await file.text();
  throw new Error('Unsupported file type: ' + ext);
}

export default function ImportInput({ onImported }) {
  const { state, dispatch, toast } = useApp();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!state.apiKey) { toast('Please configure your API key in the header.'); return; }
    setLoading(true);
    setStatus(`Reading ${file.name}...`);
    try {
      const text = await parseFileContent(file);
      setStatus('Extracting executive names with AI...');
      const prompt = `Analyze this text and extract all leadership/executive team members.
For each person return: name, title, seniority (one of: c-suite, svp, vp, director, other).
Return ONLY a valid JSON array. Example: [{"name":"Jane Doe","title":"CEO","seniority":"c-suite"}]

Text:
${text.slice(0, 25000)}`;
      const resText = await callClaude(
        [{ role: 'user', content: prompt }],
        { model: state.model, maxTokens: 4096, system: 'You are an executive research analyst. Extract names accurately.' }
      );
      const match = resText.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Could not parse leaders from file.');
      const leaders = JSON.parse(match[0]);
      if (!Array.isArray(leaders) || leaders.length === 0) throw new Error('No executives found in file.');
      const withSource = leaders.map(l => ({ ...l, source: 'Import' }));
      dispatch({ type: 'ADD_LEADERS', payload: withSource });
      setStatus(`Imported ${leaders.length} executive${leaders.length !== 1 ? 's' : ''}.`);
      toast(`Imported ${leaders.length} executives from ${file.name}.`);
      if (onImported) onImported();
    } catch (err) {
      setStatus('Error: ' + err.message);
      toast('Import failed: ' + err.message);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-6 mb-4">
      <h2 className="text-base font-bold text-advent-navy flex items-center gap-2 mb-3">
        <span className="w-1 h-[18px] bg-advent-gray-350 rounded" />
        Import from File
      </h2>

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="bg-white border border-advent-gray-350 text-advent-gray-700 px-5 py-2 rounded text-sm font-semibold hover:bg-advent-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <span className="w-4 h-4 border-2 border-advent-gray-350 border-t-advent-gray-700 rounded-full animate-spin" />}
          Import from File
        </button>
        <span className="text-xs text-advent-gray-500">Accepts: xlsx, xls, csv, docx, doc, pdf, txt</span>
      </div>

      {status && <p className="text-sm text-advent-gray-500 mt-2">{status}</p>}
    </div>
  );
}
