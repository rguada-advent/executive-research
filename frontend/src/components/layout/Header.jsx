import { useApp } from '../../context/AppContext';
import { MODELS } from '../../utils/constants';

export default function Header() {
  const { state, dispatch } = useApp();

  return (
    <header className="bg-advent-navy text-white px-6 py-3 flex items-center gap-4 shrink-0">
      <h1 className="text-lg font-bold whitespace-nowrap">
        PSG <span className="text-advent-gold">Human Capital</span>
        <span className="text-advent-gray-350 font-normal text-sm ml-2">Executive Intelligence</span>
      </h1>
      <div className="flex items-center gap-3 ml-auto">
        <label className="text-xs text-advent-gray-350">Model</label>
        <select
          value={state.model}
          onChange={e => dispatch({ type: 'SET_MODEL', payload: e.target.value })}
          className="bg-advent-navy border border-advent-gray-500 text-white px-2 py-1.5 rounded text-sm"
        >
          {MODELS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <label className="text-xs text-advent-gray-350">API Key</label>
        <input
          type="password"
          value={state.apiKey}
          onChange={e => dispatch({ type: 'SET_API_KEY', payload: e.target.value })}
          placeholder="sk-ant-..."
          className="bg-advent-navy border border-advent-gray-500 text-white px-2 py-1.5 rounded text-sm w-56"
        />
        <label className="text-xs text-advent-gold">CourtListener</label>
        <input
          type="password"
          value={state.clToken}
          onChange={e => dispatch({ type: 'SET_CL_TOKEN', payload: e.target.value })}
          placeholder="CL token (optional)"
          className="bg-advent-navy border border-advent-gray-500 text-white px-2 py-1.5 rounded text-sm w-40"
        />
      </div>
    </header>
  );
}
