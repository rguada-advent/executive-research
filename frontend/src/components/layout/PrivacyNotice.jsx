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
        <h2 className="text-lg font-bold text-advent-navy mb-1">Data Practices &amp; Use Notice</h2>
        <p className="text-xs text-advent-gray-500 uppercase tracking-wide mb-4">Investment Due Diligence Research Instrument</p>

        <div className="space-y-3 text-sm text-advent-gray-700 mb-6">
          <p>
            <strong>What we collect:</strong> PSG Executive Intelligence compiles publicly available professional information about executives and management teams for investment due diligence purposes — including career history, contact details, and publicly accessible records.
          </p>
          <p>
            <strong>Where data is stored:</strong> All research data is stored <strong>locally on your device only</strong>. No candidate data is transmitted to PSG servers.
          </p>
          <p>
            <strong>Third-party AI:</strong> Executive names and publicly available information are sent to the selected AI provider (Anthropic, OpenAI, or Google Gemini) to generate research summaries. The selected provider's privacy policy applies to this processing.
          </p>
          <p>
            <strong>Your rights:</strong> You may delete all locally stored research data at any time using the "Clear All Data" option in the header.
          </p>
          <p>
            <strong>Purpose limitation:</strong> This tool is designed for investment due diligence and management quality assessment in connection with investment decisions. It is not an employment screening tool, background check service, or consumer reporting agency. AI-generated research observations are informational only and do not constitute employment screening, adverse action reports, or eligibility determinations of any kind.
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
