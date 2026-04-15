import MarkdownRenderer from '../../shared/MarkdownRenderer';

export default function ProfileTab({ brief }) {
  if (!brief) {
    return (
      <div className="text-center py-12 text-advent-gray-500">
        <p>No report yet. Investigate this person first.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-8">
      <MarkdownRenderer content={brief} />
    </div>
  );
}
