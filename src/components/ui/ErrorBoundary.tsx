import { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes — including a lazy chunk that fails to load
 * after a deploy — and offers a reload instead of a blank screen.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const isChunkError = /dynamically imported module|Loading chunk/i.test(
      this.state.error.message
    );

    return (
      <div className="crash">
        <span className="crash__icon">
          <TriangleAlert size={26} />
        </span>
        <h1 className="crash__title">
          {isChunkError ? "A new version is available" : "Something broke"}
        </h1>
        <p className="crash__text">
          {isChunkError
            ? "This tab is running an older build. Reload to pick up the latest one."
            : "That's on us. Reloading usually clears it — your data is safe."}
        </p>
        <button
          className="btn btn--accent"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={16} />
          Reload FinHash
        </button>
      </div>
    );
  }
}
