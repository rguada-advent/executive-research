export default function SearchIndicator({ active, label }) {
  if (!active) return null;
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-advent-gray-75 rounded text-advent-cyan text-sm my-2">
      <span className="w-4 h-4 border-2 border-advent-gray-350 border-t-advent-cyan rounded-full animate-spin" />
      {label || 'Searching'}...
    </div>
  );
}
