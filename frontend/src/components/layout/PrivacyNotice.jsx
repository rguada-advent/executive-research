import { useState, useEffect } from 'react';

const STORAGE_KEY = 'psg_privacy_accepted';

export default function PrivacyNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8">
        <h2 className="text-lg font-bold text-advent-navy mb-1">Data Practices Notice</h2>
        <p className="text-xs text-advent-gray-500 uppercase tracking-wide mb-4">Required under CCPA and U.S. State Privacy Laws</p>

        <div className="space-y-3 text-sm text-advent-gray-700 mb-6">
          <p>
            <strong>What we collect:</strong> PSG Executive Intelligence researches publicly available professional information about executive candidates — including names, employment history, contact details, and publicly accessible records.
          </p>
          <p>
            <strong>Where data is stored:</strong> All research data is stored <strong>locally on your device only</strong>. No candidate data is transmitted to PSG servers.
          </p>
          <p>
            <strong>Third-party AI:</strong> Candidate names and publicly available information are sent to Anthropic's Claude API to generate research summaries. Anthropic's privacy policy applies to this processing.
          </p>
          <p>
            <strong>Your rights:</strong> You may delete all locally stored research data at any time using the "Clear All Data" option in the header.
          </p>
          <p>
            <strong>Purpose limitation:</strong> This tool is intended for professional executive research only. AI-generated assessments are advisory and must be reviewed by a qualified human evaluator before informing any employment decision.
          </p>
        </div>

        <button
          onClick={handleAccept}
          className="w-full bg-advent-blue text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Understood — Continue
        </button>
      </div>
    </div>
  );
}
