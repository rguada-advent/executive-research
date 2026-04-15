import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { callClaude } from '../../services/claudeApi';
import { parseFileContent } from '../../utils/fileParser';

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
