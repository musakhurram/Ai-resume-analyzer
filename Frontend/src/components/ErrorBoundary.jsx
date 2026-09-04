import { Component } from "react";
import Button from "../shared/components/Button";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Resume Analyzer UI error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-error-state" role="alert" aria-live="assertive">
        <div className="app-error-state__card">
          <span className="eyebrow">Something went wrong</span>
          <h1>We couldn’t load this screen.</h1>
          <p>Refresh the page and try again. Your saved account data is not affected.</p>
          <Button variant="primary" onClick={this.handleReload}>Refresh Page</Button>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
