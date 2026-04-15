import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { callClaude } from '../../services/claudeApi';
import { parseFileContent } from '../../utils/fileParser';

export default function LinkedInInput({ onAdded }) {
  const { state, dispatch, toast } = useApp();
  const [tab, setTab] = useState('url'); // 'url' | 'export'

  // URL tab state
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');

  // Export tab state
  const [exportStatus, setExportStatus] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const fileRef = useRef(null);

  function handleAddUrl() {
    if (!name.trim()) { toast('Name is required.'); return; }
    const leader = {
      name: name.trim(),
      title: title.trim() || 'Executive',
      company: company.trim(),
      seniority: 'other',
      source: 'LinkedIn',
      linkedinUrl: linkedinUrl.trim() || undefined,
    };
    dispatch({ type: 'ADD_LEADER', payload: leader });
    toast(`Added ${leader.name} from LinkedIn.`);
    setLinkedinUrl('');
    setName('');
    setTitle('');
    setCompany('');
    if (onAdded) onAdded();
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!state.apiKey) { toast('Please configure your API key in the header.'); return; }
    setExportLoading(true);
    setExportStatus(`Reading ${file.name}...`);
    try {
      const text = await parseFileContent(file);
      setExportStatus('Extracting profile with AI...');
      const prompt = `This is an exported LinkedIn profile. Extract the following fields:
- name (full name)
- title (current job title or headline)
- company (current employer)
- location (city/region if available)
- linkedinUrl (the LinkedIn profile URL if visible in the document)
- seniority (one of: c-suite, svp, vp, director, other — infer from title)

Return ONLY valid JSON (no markdown):
{"name":"...","title":"...","company":"...","location":"...","linkedinUrl":"...","seniority":"..."}

Profile text:
${text.slice(0, 20000)}`;

      const resText = await callClaude(
        [{ role: 'user', content: prompt }],
        { model: state.model, maxTokens: 1024, system: 'You are a professional profile extractor. Return only valid JSON.' }
      );

      const fenced = resText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      const bare = resText.match(/\{[\s\S]*\}/);
      const match = fenced ? fenced[1] : (bare ? bare[0] : null);
      if (!match) throw new Error('Could not parse profile from file.');
      const profile = JSON.parse(match);
      if (!profile.name) throw new Error('Could not extract a name from this file.');

      const leader = {
        name: profile.name,
        title: profile.title || 'Executive',
        company: profile.company || '',
        seniority: profile.seniority || 'other',
        source: 'LinkedIn',
        linkedinUrl: profile.linkedinUrl || undefined,
      };
      dispatch({ type: 'ADD_LEADER', payload: leader });
      setExportStatus(`Added ${leader.name}.`);
      toast(`Imported ${leader.name} from LinkedIn export.`);
      if (onAdded) onAdded();
    } catch (err) {
      setExportStatus('Error: ' + err.message);
      toast('Import failed: ' + err.message);
    } finally {
      setExportLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-6 mb-4">
      <h2 className="text-base font-bold text-advent-navy flex items-center gap-2 mb-3">
        <span className="w-1 h-[18px] bg-[#0077B5] rounded" />
        Add from LinkedIn
      </h2>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-advent-gray-200">
        {[['url', 'LinkedIn URL'], ['export', 'Profile Export']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-[#0077B5] text-[#0077B5]'
                : 'border-transparent text-advent-gray-500 hover:text-advent-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'url' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">LinkedIn Profile URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                placeholder="https://www.linkedin.com/in/username"
                className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
                placeholder="Jane Smith"
                className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">Title / Role</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Chief Financial Officer"
                className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-advent-gray-500 uppercase tracking-wide mb-1">Company</label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full border border-advent-gray-350 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleAddUrl}
            disabled={!name.trim()}
            className="bg-[#0077B5] text-white px-5 py-2 rounded text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to Pipeline
          </button>
        </div>
      )}

      {tab === 'export' && (
        <div>
          <p className="text-sm text-advent-gray-500 mb-3">
            Upload a LinkedIn profile export (PDF, TXT). AI will extract the executive's profile automatically.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={exportLoading}
              className="bg-white border border-advent-gray-350 text-advent-gray-700 px-5 py-2 rounded text-sm font-semibold hover:bg-advent-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {exportLoading && <span className="w-4 h-4 border-2 border-advent-gray-350 border-t-advent-gray-700 rounded-full animate-spin" />}
              Upload Profile Export
            </button>
            <span className="text-xs text-advent-gray-500">Accepts: pdf, txt</span>
          </div>
          {exportStatus && <p className="text-sm text-advent-gray-500 mt-2">{exportStatus}</p>}
        </div>
      )}
    </div>
  );
}
