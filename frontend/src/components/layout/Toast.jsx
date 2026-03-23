import { useApp } from '../../context/AppContext';

export default function Toast() {
  const { state } = useApp();

  if (!state.toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {state.toasts.map(t => (
        <div
          key={t.id}
          className="bg-risk-none text-white px-5 py-3 rounded-lg text-sm font-medium shadow-lg animate-[slideIn_0.3s_ease-out]"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
