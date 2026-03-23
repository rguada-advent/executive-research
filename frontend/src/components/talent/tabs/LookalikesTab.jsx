export default function LookalikesTab({ lookalikes, loading, onRunLookalikes }) {
  if (loading && !lookalikes) {
    return (
      <div className="bg-white rounded-xl border border-advent-gray-200 p-10 text-center">
        <span className="inline-block w-8 h-8 border-2 border-advent-gray-350 border-t-advent-blue rounded-full animate-spin mb-4" />
        <p className="text-sm text-advent-gray-500">Finding similar executives...</p>
      </div>
    );
  }

  if (!lookalikes || lookalikes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-advent-gray-200 p-10 text-center">
        <p className="text-base text-advent-gray-400 mb-2">No lookalikes found yet.</p>
        <p className="text-sm text-advent-gray-500 mb-4">Find executives with similar profiles, titles, and career trajectories.</p>
        {onRunLookalikes && (
          <button
            onClick={onRunLookalikes}
            className="bg-advent-blue text-white px-5 py-2 rounded text-sm font-semibold hover:opacity-90"
          >
            Find Lookalikes
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-advent-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-advent-navy">
          Similar Executives ({lookalikes.length})
        </h3>
        {onRunLookalikes && (
          <button
            onClick={onRunLookalikes}
            className="text-advent-blue text-sm font-semibold hover:underline"
          >
            Refresh
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-advent-gray-75">
              <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b-2 border-advent-gray-200">Name</th>
              <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b-2 border-advent-gray-200">Title</th>
              <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b-2 border-advent-gray-200">Company</th>
              <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b-2 border-advent-gray-200">LinkedIn</th>
              <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-advent-gray-500 uppercase tracking-wide border-b-2 border-advent-gray-200">Why Similar</th>
            </tr>
          </thead>
          <tbody>
            {lookalikes.map((person, i) => (
              <tr key={i} className="border-b border-advent-gray-100 hover:bg-advent-gray-50">
                <td className="px-3 py-2.5 text-sm font-semibold text-advent-gray-700">
                  {person.name}
                </td>
                <td className="px-3 py-2.5 text-sm text-advent-gray-600">
                  {person.title}
                </td>
                <td className="px-3 py-2.5 text-sm text-advent-gray-600">
                  {person.company}
                </td>
                <td className="px-3 py-2.5 text-sm">
                  {person.linkedinUrl ? (
                    <a
                      href={person.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0a66c2] hover:underline font-medium"
                    >
                      Profile →
                    </a>
                  ) : (
                    <span className="text-advent-gray-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs text-advent-gray-500 max-w-[200px]">
                  {person.similarity || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
