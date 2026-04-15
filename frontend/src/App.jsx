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
        <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ color: '#dc2626', fontSize: 20, marginBottom: 12 }}>Something went wrong</h1>
          <pre style={{ background: '#fef2f2', padding: 16, borderRadius: 8, fontSize: 13, overflow: 'auto', whiteSpace: 'pre-wrap', color: '#374151', border: '1px solid #fca5a5' }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: null, errorInfo: null }); }}
            style={{ marginTop: 16, padding: '8px 20px', background: '#022479', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
          >
            Try Again
          </button>
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
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
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
