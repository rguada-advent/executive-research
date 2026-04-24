import { useApp } from '../../context/AppContext';
import { MODES } from '../../utils/constants';

const MODE_META = {
  [MODES.TALENT]: {
    title: 'Talent Discovery',
    tagline: 'Build management pipelines and run Spec Mirror DD analysis',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  [MODES.FORENSIC]: {
    title: 'Forensic Intelligence',
    tagline: 'Due Diligence management intelligence: legal, regulatory, social & verification',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
        <path d="M11 8v6" />
        <path d="M8 11h6" />
      </svg>
    ),
  },
};

function ModeCard({ mode, active, onClick }) {
  const meta = MODE_META[mode];
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`
        group relative flex-1 text-left px-5 py-4 rounded-xl border transition-all duration-200
        flex items-start gap-4
        ${active
          ? 'bg-white border-[var(--border-strong)] shadow-md ring-1 ring-advent-navy/5'
          : 'bg-transparent border-transparent hover:bg-white/60 hover:border-[var(--border-subtle)]'
        }
      `}
    >
      {active && <span className="absolute left-0 top-4 bottom-4 w-[3px] bg-advent-navy rounded-r" aria-hidden />}
      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
        active
          ? 'bg-advent-navy text-white'
          : 'bg-advent-gray-100 text-advent-gray-500 group-hover:bg-advent-gray-200 group-hover:text-advent-navy'
      }`}>
        {meta.icon}
      </div>
      <div className="min-w-0">
        <div className={`text-[14px] font-semibold tracking-tight ${active ? 'text-advent-navy' : 'text-advent-gray-700'}`}>
          {meta.title}
        </div>
        <div className="text-[12px] text-advent-gray-500 mt-0.5 leading-snug">
          {meta.tagline}
        </div>
      </div>
    </button>
  );
}

export default function ModeSelector() {
  const { state, dispatch } = useApp();
  return (
    <div className="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]">
      <div className="max-w-[1600px] mx-auto px-6 py-3">
        <div className="flex gap-2">
          <ModeCard
            mode={MODES.TALENT}
            active={state.mode === MODES.TALENT}
            onClick={() => dispatch({ type: 'SET_MODE', payload: MODES.TALENT })}
          />
          <ModeCard
            mode={MODES.FORENSIC}
            active={state.mode === MODES.FORENSIC}
            onClick={() => dispatch({ type: 'SET_MODE', payload: MODES.FORENSIC })}
          />
        </div>
      </div>
    </div>
  );
}
