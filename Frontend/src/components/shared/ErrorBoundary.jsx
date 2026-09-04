import { Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep production recovery local to the UI. The app can still be wired to
    // an error-monitoring service later without exposing implementation details.
    if (import.meta.env.DEV) {
      console.error("Resume Analyzer UI error:", error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-error" role="alert">
        <div className="app-error__card">
          <span className="eyebrow">Resume Analyzer</span>
          <h1>Something went wrong</h1>
          <p>
            The page hit an unexpected error. Your saved account data is not
            affected. Try again, or reload the app if the problem continues.
          </p>
          <div className="app-error__actions">
            <button type="button" className="app-error__primary" onClick={this.handleRetry}>
              Try again
            </button>
            <button type="button" className="app-error__secondary" onClick={this.handleReload}>
              Reload app
            </button>
          </div>
          {import.meta.env.DEV && this.state.error?.message && (
            <details className="app-error__details">
              <summary>Developer details</summary>
              <code>{this.state.error.message}</code>
            </details>
          )}
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
