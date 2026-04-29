import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4" dir="rtl">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-amber-200 text-center">
            <h2 className="text-2xl font-bold text-red-700 mb-4">عذراً، حدث خطأ ما</h2>
            <p className="text-gray-600 mb-6">
              نعتذر عن هذا الخلل. يرجى تحديث الصفحة أو المحاولة لاحقاً.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-emerald-700 text-white px-6 py-2 rounded-lg hover:bg-emerald-800 transition-colors"
            >
              تحديث الصفحة
            </button>
            {this.state.error && (
              <pre className="mt-6 text-left text-xs bg-gray-100 p-4 rounded overflow-auto text-gray-800" dir="ltr">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
