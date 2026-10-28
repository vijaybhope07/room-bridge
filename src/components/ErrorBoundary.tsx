import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RoomBridge ErrorBoundary Caught Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('roombridge_questionnaire_answers');
    } catch (e) {}
    window.location.href = '/';
  };

  private handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white font-sans">
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Something went wrong
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                RoomBridge encountered an unexpected rendering error. You can reload the page or reset cached session data below.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-left overflow-x-auto text-xs text-rose-300 font-mono max-h-36">
                <p className="font-bold">{this.state.error.toString()}</p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleHardReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-600 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Reset Cache &amp; Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
