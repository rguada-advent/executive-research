import { useApp } from '../../context/AppContext';
import { MODES } from '../../utils/constants';

export default function ModeSelector() {
  const { state, dispatch } = useApp();

  return (
    <div className="bg-white border-b border-advent-gray-200 px-6 py-2 flex gap-0">
      <button
        onClick={() => dispatch({ type: 'SET_MODE', payload: MODES.TALENT })}
        className={`px-6 py-2.5 text-sm font-semibold rounded-l-lg border transition-colors ${
          state.mode === MODES.TALENT
            ? 'bg-advent-blue text-white border-advent-blue'
            : 'bg-white text-advent-gray-700 border-advent-gray-350 hover:bg-advent-gray-75'
        }`}
      >
        Talent Discovery
      </button>
      <button
        onClick={() => dispatch({ type: 'SET_MODE', payload: MODES.FORENSIC })}
        className={`px-6 py-2.5 text-sm font-semibold rounded-r-lg border-t border-b border-r transition-colors ${
          state.mode === MODES.FORENSIC
            ? 'bg-advent-blue text-white border-advent-blue'
            : 'bg-white text-advent-gray-700 border-advent-gray-350 hover:bg-advent-gray-75'
        }`}
      >
        Forensic Intelligence
      </button>
    </div>
  );
}
