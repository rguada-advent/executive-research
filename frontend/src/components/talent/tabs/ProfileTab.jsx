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
      <MarkdownRenderer
        content={brief}
        className="prose-h1:text-2xl prose-h1:text-advent-navy prose-h1:mb-1 prose-h2:text-[17px] prose-h2:text-advent-blue prose-h2:mt-6 prose-h2:mb-2 prose-h2:pb-1 prose-h2:border-b-2 prose-h2:border-advent-gray-200 prose-h3:text-[15px] prose-h3:text-advent-navy prose-h3:mt-4 prose-h3:mb-1 prose-a:text-advent-blue prose-p:my-1.5 leading-relaxed text-[15px] text-gray-800"
      />
    </div>
  );
}
