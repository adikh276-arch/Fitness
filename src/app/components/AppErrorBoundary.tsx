'use client';

import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router';
import { handleExit } from '@/lib/navigation';

interface AppErrorViewProps {
  error?: unknown;
  onReset?: () => void;
}

export function AppErrorView({ error, onReset }: AppErrorViewProps) {
  let title = "Something went wrong";
  let message = "An unexpected error occurred while loading this activity. Please try refreshing or return to dashboard.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Page Not Found";
      message = "The requested activity or page could not be found.";
    } else {
      title = `${error.status} ${error.statusText || 'Error'}`;
      message = error.data?.message || message;
    }
  } else if (error instanceof Error) {
    // Only show user-friendly message or concise error title in non-dev, keep clean
    if (process.env.NODE_ENV === 'development') {
      message = error.message;
    }
  }

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fit_opened_from_dashboard', 'true');
      window.location.href = '/fitness';
    }
  };

  const handleClose = () => {
    handleExit();
  };

  const handleRetry = () => {
    if (onReset) {
      onReset();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        {/* Friendly visual icon */}
        <div className="w-20 h-20 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100/60 flex items-center justify-center mb-5 text-4xl shadow-inner">
          🧘
        </div>

        <span className="text-xs font-semibold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-3">
          Wellness App
        </span>

        <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight mb-2">
          {title}
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-xs">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={handleRetry}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.99] transition-all cursor-pointer"
          >
            Try Again
          </button>

          <button
            onClick={handleGoHome}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.99] transition-all cursor-pointer"
          >
            Go to Fitness Dashboard
          </button>

          <button
            onClick={handleClose}
            className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Exit Activity
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error instanceof Error && (
          <details className="mt-6 text-left w-full text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100 overflow-auto max-h-40">
            <summary className="cursor-pointer font-medium text-slate-600 mb-1">
              Technical Details (Dev Only)
            </summary>
            <pre className="whitespace-pre-wrap font-mono text-[10px] text-red-600">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Route-level Error Boundary component for react-router errorElement
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  return <AppErrorView error={error} />;
}

interface ReactErrorBoundaryProps {
  children: React.ReactNode;
}

interface ReactErrorBoundaryState {
  hasError: boolean;
  error?: unknown;
}

/**
 * Class-based React Error Boundary for enclosing high-level component trees
 */
export class GlobalReactErrorBoundary extends React.Component<ReactErrorBoundaryProps, ReactErrorBoundaryState> {
  constructor(props: ReactErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): ReactErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error('Captured by GlobalReactErrorBoundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return <AppErrorView error={this.state.error} onReset={this.resetError} />;
    }
    return this.props.children;
  }
}
