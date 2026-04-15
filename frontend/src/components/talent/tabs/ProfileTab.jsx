import MarkdownRenderer from '../../shared/MarkdownRenderer';

export default function ProfileTab({ brief, loading }) {
  if (loading && !brief) {
    return (
      <div className="bg-white rounded-xl border border-advent-gray-200 p-10 text-center">
        <span className="inline-block w-8 h-8 border-2 border-advent-gray-350 border-t-advent-blue rounded-full animate-spin mb-4" />
        <p className="text-sm text-advent-gray-500">Researching executive profile...</p>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="bg-white rounded-xl border border-advent-gray-200 p-10 text-center text-advent-gray-400">
        <p className="text-base">No profile brief yet.</p>
        <p className="text-sm mt-1">Click "Research" to generate a full executive brief.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-8">
      <MarkdownRenderer content={brief} />
    </div>
  );
}
