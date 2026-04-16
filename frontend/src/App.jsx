import { Component } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/layout/Header';
import ModeSelector from './components/layout/ModeSelector';
import Toast from './components/layout/Toast';
import PrivacyNotice from './components/layout/PrivacyNotice';
import ForensicView from './components/forensic/ForensicView';
import TalentView from './components/talent/TalentView';
import { MODES } from './utils/constants';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('React Error Boundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-12 psg-card overflow-hidden psg-fade-up">
          <div className="h-1 bg-advent-gold" />
          <div className="p-8">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>
                  <path d="M12 9v4"/>
                  <path d="M12 17h.01"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-advent-navy tracking-tight">Something went wrong</h1>
                <p className="text-sm text-advent-gray-500 mt-1">
                  The app encountered an unexpected error. Your data is safe — nothing has been lost.
                </p>
              </div>
            </div>
            <pre className="bg-advent-gray-75 border border-[var(--border-subtle)] rounded-lg p-4 text-[11px] font-mono text-advent-gray-700 overflow-auto whitespace-pre-wrap max-h-64">
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { this.setState({ hasError: false, error: null, errorInfo: null }); }}
                className="psg-btn psg-btn-primary"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="psg-btn psg-btn-secondary"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { state } = useApp();
  return (
    <div className="min-h-screen flex flex-col bg-advent-bg">
      <Header />
      <ModeSelector />
      <main className="flex-1 px-6 py-6 max-w-[1600px] mx-auto w-full">
        <ErrorBoundary>
          {state.mode === MODES.FORENSIC ? (
            <ForensicView />
          ) : (
            <TalentView />
          )}
        </ErrorBoundary>
      </main>
      <Toast />
      <PrivacyNotice />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
