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
      <MarkdownRenderer content={questions} />
    </div>
  );
}
