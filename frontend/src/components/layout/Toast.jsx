import { useApp } from '../../context/AppContext';

function toastKind(message = '') {
  const m = message.toLowerCase();
  if (m.includes('fail') || m.includes('error') || m.includes('unable')) return 'error';
  if (m.includes('warn') || m.includes('caution')) return 'warn';
  return 'success';
}

const KIND_STYLES = {
  success: { bar: 'bg-emerald-500', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
  ) },
  warn: { bar: 'bg-amber-500', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
  ) },
  error: { bar: 'bg-red-500', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
  ) },
};

export default function Toast() {
  const { state } = useApp();
  if (!state.toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm psg-no-print">
      {state.toasts.map(t => {
        const kind = toastKind(t.message);
        const style = KIND_STYLES[kind];
        return (
          <div
            key={t.id}
            className="relative bg-white rounded-xl shadow-lg border border-[var(--border-subtle)] pl-4 pr-5 py-3 flex items-start gap-3 min-w-[280px] psg-toast-in overflow-hidden"
          >
            <span className={`absolute left-0 top-0 bottom-0 w-1 ${style.bar}`} aria-hidden />
            <span className="mt-0.5 shrink-0">{style.icon}</span>
            <div className="text-[13px] text-advent-gray-700 leading-snug font-medium">
              {t.message}
            </div>
          </div>
        );
      })}
    </div>
  );
}
