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
    <div className="bg-white rounded-xl border border-advent-gray-200 p-10">
      <MarkdownRenderer
        content={brief}
        className="[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#1a1a2e] [&_h1]:mb-1 [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-[#991b1b] [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:pb-1 [&_h2]:border-b-2 [&_h2]:border-advent-gray-200 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-[#1a1a2e] [&_h3]:mt-4 [&_h3]:mb-1.5 [&_ul]:my-1.5 [&_ul]:ml-5 [&_li]:my-0.5 [&_a]:text-[#991b1b] [&_p]:my-1.5 leading-relaxed text-[15px] text-[#1a1a2e]"
      />
    </div>
  );
}
