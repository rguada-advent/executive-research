import { useState, useEffect } from 'react';

const STORAGE_KEY = 'psg_talent_search_history';
const EXPIRY_DAYS = 90; // 3 months

function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries = JSON.parse(raw);
    // Filter out entries older than 90 days
    const cutoff = Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    return entries.filter(e => e.timestamp >= cutoff);
  } catch { return []; }
}

function saveHistory(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* storage full */ }
}

export function addToHistory(leader, researchData) {
  const entries = getHistory();
  // Check for existing entry with same name + company
  const key = `${(leader.name || '').toLowerCase()}|${(leader.company || '').toLowerCase()}`;
  const existing = entries.findIndex(e => e.key === key);
  const entry = {
    key,
    name: leader.name,
    title: leader.title,
    company: leader.company || '',
    seniority: leader.seniority || 'other',
    timestamp: Date.now(),
    linkedinUrl: researchData?.linkedinUrl || '',
    summary: researchData?.summary || '',
    location: researchData?.location || '',
    hasScoring: !!researchData?.scoring,
    score: researchData?.scoring?.overallScore || null,
  };
  if (existing >= 0) {
    entries[existing] = entry; // Update existing
  } else {
    entries.unshift(entry); // Add to front
  }
  saveHistory(entries);
}

export function checkHistory(name, company) {
  const entries = getHistory();
  const key = `${(name || '').toLowerCase()}|${(company || '').toLowerCase()}`;
  return entries.find(e => e.key === key) || null;
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function SearchHistory({ onSelectLeader }) {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setEntries(getHistory());
  }, []);

  const filtered = search
    ? entries.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.company.toLowerCase().includes(search.toLowerCase()) ||
        e.title.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  function handleClear() {
    clearHistory();
    setEntries([]);
  }

  function handleRemove(key) {
    const updated = entries.filter(e => e.key !== key);
    saveHistory(updated);
    setEntries(updated);
  }

  function formatDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-advent-navy flex items-center gap-2">
          <span className="w-1 h-[18px] bg-advent-gold rounded" />
          Search History
          <span className="text-xs font-normal text-advent-gray-500 ml-1">({entries.length} searches, last 3 months)</span>
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter history..."
            className="border border-advent-gray-350 rounded px-3 py-1.5 text-sm w-48"
          />
          <button
            onClick={handleClear}
            className="text-xs text-advent-gray-500 hover:text-risk-high"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white">
            <tr className="bg-advent-gray-75">
              <th className="text-left px-3 py-2 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b border-advent-gray-200">Name</th>
              <th className="text-left px-3 py-2 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b border-advent-gray-200">Title</th>
              <th className="text-left px-3 py-2 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b border-advent-gray-200">Company</th>
              <th className="text-left px-3 py-2 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b border-advent-gray-200">Searched</th>
              <th className="text-left px-3 py-2 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b border-advent-gray-200">LinkedIn</th>
              <th className="text-left px-3 py-2 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b border-advent-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => (
              <tr key={entry.key} className="border-b border-advent-gray-100 hover:bg-advent-gray-50">
                <td className="px-3 py-2 text-sm font-semibold text-advent-gray-700">{entry.name}</td>
                <td className="px-3 py-2 text-sm text-advent-gray-600">{entry.title}</td>
                <td className="px-3 py-2 text-sm text-advent-gray-600">{entry.company}</td>
                <td className="px-3 py-2 text-xs text-advent-gray-500">{formatDate(entry.timestamp)}</td>
                <td className="px-3 py-2 text-sm">
                  {entry.linkedinUrl ? (
                    <a href={entry.linkedinUrl} target="_blank" rel="noreferrer" className="text-[#0a66c2] hover:underline text-xs font-medium">
                      Profile →
                    </a>
                  ) : <span className="text-advent-gray-400 text-xs">—</span>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onSelectLeader && onSelectLeader({
                        name: entry.name, title: entry.title,
                        company: entry.company, seniority: entry.seniority,
                      })}
                      className="text-advent-blue text-xs font-semibold hover:underline"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleRemove(entry.key)}
                      className="text-advent-gray-400 hover:text-risk-high text-xs ml-2"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
