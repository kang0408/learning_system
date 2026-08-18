import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Translation } from 'react-i18next';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
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
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <Translation>
          {(t) => (
            <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-8 text-center bg-red-50 rounded-xl border border-red-200">
              <h2 className="mb-4 text-2xl font-black text-red-600">{t('common.ui.systemError')}</h2>
              <p className="mb-6 text-red-500 max-w-md">
                {this.state.error?.message || t('common.ui.loadError')}
              </p>
              <button
                className="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                {t('common.ui.retry')}
              </button>
            </div>
          )}
        </Translation>
      );
    }

    return this.props.children;
  }
}
