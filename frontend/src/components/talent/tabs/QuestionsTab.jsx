import MarkdownRenderer from '../../shared/MarkdownRenderer';

export default function QuestionsTab({ questions, loading, onRunQuestions, specLoaded }) {
  if (loading && !questions) {
    return (
      <div className="bg-white rounded-xl border border-advent-gray-200 p-10 text-center">
        <span className="inline-block w-8 h-8 border-2 border-advent-gray-350 border-t-advent-blue rounded-full animate-spin mb-4" />
        <p className="text-sm text-advent-gray-500">Generating screening questions...</p>
      </div>
    );
  }

  if (!questions) {
    return (
      <div className="bg-white rounded-xl border border-advent-gray-200 p-10 text-center">
        {specLoaded ? (
          <>
            <p className="text-base text-advent-gray-500 mb-3">No screening questions generated yet.</p>
            <button
              onClick={onRunQuestions}
              className="bg-risk-none text-white px-5 py-2 rounded text-sm font-semibold hover:opacity-90"
            >
              Generate Screening Questions
            </button>
          </>
        ) : (
          <>
            <p className="text-base text-advent-gray-500 mb-1">Screening questions require a recruiting specification.</p>
            <p className="text-sm text-advent-gray-400">Load a spec in the input view to enable this feature.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-8">
      <MarkdownRenderer
        content={questions}
        className="prose-h1:text-xl prose-h1:text-advent-navy prose-h1:mb-2 prose-h2:text-[17px] prose-h2:text-advent-blue prose-h2:mt-6 prose-h2:mb-2 prose-h2:pb-1 prose-h2:border-b-2 prose-h2:border-advent-gray-200 prose-h3:text-[15px] prose-h3:text-gray-800 prose-h3:mt-4 prose-h3:mb-1 prose-ol:ml-5 prose-ul:ml-5 prose-li:my-1.5 prose-em:text-xs prose-em:text-gray-500 leading-relaxed text-[15px] text-gray-800"
      />
    </div>
  );
}
