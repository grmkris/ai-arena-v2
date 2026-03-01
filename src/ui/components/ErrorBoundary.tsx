import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught rendering error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-6 text-center max-w-md">
              <div className="text-red-400 font-mono text-lg mb-2">Something went wrong</div>
              <div className="text-gray-400 text-sm mb-4">{this.state.error?.message ?? "Unknown error"}</div>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-mono transition-colors"
              >
                RELOAD
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
