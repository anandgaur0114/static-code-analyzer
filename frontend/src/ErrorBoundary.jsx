import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 text-dark-100 flex items-center justify-center p-6">
          <div className="bg-dark-800 border border-red-500/40 rounded-xl p-6 max-w-xl w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-bold">Studio Interface Error</h2>
            </div>
            <p className="text-xs text-dark-300 mb-4">
              An unexpected error occurred while rendering the workspace:
            </p>
            <div className="bg-dark-900 border border-dark-700 rounded-lg p-3 text-xs font-mono text-red-300 overflow-auto max-h-48 mb-4 whitespace-pre-wrap">
              {this.state.error?.toString()}
              {this.state.errorInfo?.componentStack}
            </div>
            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-brand-blue text-white text-xs font-semibold rounded-lg hover:bg-brand-blue/90 flex items-center gap-2 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
