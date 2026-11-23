import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#1E293B] border border-slate-700/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
            <p className="text-sm text-slate-300 break-words font-mono bg-slate-900/70 p-3 rounded-lg border border-slate-800">
              {this.state.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-[#00D4FF] text-slate-950 font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
