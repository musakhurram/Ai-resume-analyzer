import { useEffect, useRef } from "react";
import "./GoogleSignInButton.scss";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Google Identity Services keeps its initialize() state globally. React 18+
// StrictMode intentionally mounts effects twice in development, and auth
// pages can also remount this component during navigation. Keep one GSI
// initialization and always route the response to the latest component.
let initializedClientId = null;
let latestCredentialHandler = null;

const handleGoogleCredential = (response) => {
  if (response?.credential) {
    latestCredentialHandler?.(response.credential);
  }
};

const handleGoogleError = (err) => {
  console.error("[GoogleSignIn] Google Identity error:", err);
};

function initializeGoogleIdentity() {
  if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return false;

  if (initializedClientId !== GOOGLE_CLIENT_ID) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      error_callback: handleGoogleError,
      auto_select: false,
    });
    initializedClientId = GOOGLE_CLIENT_ID;
  }

  return true;
}

/**
 * Renders a plain, always-consistent "Continue with Google" button.
 * Google's real button is rendered transparently on top of our visual button
 * so the actual Google authentication flow remains fully controlled by GSI.
 */
const GoogleSignInButton = ({ onCredential, disabled }) => {
  const realBtnRef = useRef(null);
  const onCredentialRef = useRef(onCredential);

  // Always keep the singleton callback pointed at the current page's handler
  // without causing GSI initialize() to run again on every render.
  useEffect(() => {
    onCredentialRef.current = onCredential;
    latestCredentialHandler = (credential) => onCredentialRef.current?.(credential);

    return () => {
      if (latestCredentialHandler) latestCredentialHandler = null;
    };
  }, [onCredential]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || disabled) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40;

    const render = () => {
      if (cancelled || !window.google?.accounts?.id || !realBtnRef.current) return;

      try {
        if (!initializeGoogleIdentity()) return;

        realBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(realBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          width: 340,
          text: "continue_with",
        });
      } catch (err) {
        console.error("[GoogleSignIn] Failed to render Google button:", err);
      }
    };

    if (window.google?.accounts?.id) {
      render();
    } else {
      const interval = setInterval(() => {
        attempts += 1;
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          render();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          console.error(
            "[GoogleSignIn] Google Identity script failed to load. Check your network or adblocker."
          );
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
  }, [disabled]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="google-signin-btn">
      <div className="google-signin-btn__visual" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.9 29.6 4.9 24 4.9c-7.6 0-14.1 4.3-17.7 9.8z" />
          <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5c-2.1 1.5-4.7 2.4-7.6 2.4-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.8 39.6 16.3 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.5 5.5C41.5 36.4 44 30.7 44 24c0-1.3-.1-2.7-.4-3.5z" />
        </svg>
        <span>Continue with Google</span>
      </div>

      <div
        ref={realBtnRef}
        className={`google-signin-btn__real${disabled ? " is-disabled" : ""}`}
        aria-label="Continue with Google"
        aria-live="polite"
      />
    </div>
  );
};

export default GoogleSignInButton;
