import { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Renders Google's own "Continue with Google" button via the Google
 * Identity Services script (loaded in index.html) and forwards the signed
 * credential (an ID token) to onCredential for the backend to verify.
 *
 * Renders nothing if VITE_GOOGLE_CLIENT_ID isn't configured, so the rest of
 * the auth form still works without it.
 */
const GoogleSignInButton = ({ onCredential, disabled }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || disabled) return;

    let cancelled = false;

    function render() {
      if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });

      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 340,
        text: "continue_with",
      });
    }

    if (window.google?.accounts?.id) {
      render();
    } else {
      // The GSI script loads async — poll briefly until it's ready.
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          render();
        }
      }, 150);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [disabled, onCredential]);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={containerRef} className="google-signin-btn" aria-live="polite" />;
};

export default GoogleSignInButton;
