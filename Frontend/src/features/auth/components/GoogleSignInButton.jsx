import { useEffect, useRef, useState } from "react";
import "./GoogleSignInButton.scss";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
    />
  </svg>
);

/**
 * Google's own rendered button reflects the visitor's live Google session
 * (e.g. a personalized "Continue as [Name]" chip with photo, on a
 * background Google controls) and there's no supported flag on
 * renderButton() to force the plain button instead.
 *
 * To get a fully custom look while keeping the ID-token flow the backend
 * already verifies (no backend changes needed), this renders our own
 * themed button for display, then stacks Google's real button invisibly
 * on top of it at the same size/position. Real user clicks land on
 * Google's real iframe button — a synthetic click can't be faked into it
 * for security reasons, which is exactly why this overlay approach is
 * used instead — so the flow still works, but the user only ever sees
 * our design.
 *
 * Renders nothing if VITE_GOOGLE_CLIENT_ID isn't configured, so the rest
 * of the auth form still works without it.
 */
const GoogleSignInButton = ({ onCredential, disabled }) => {
  const googleContainerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || disabled) return;

    let cancelled = false;

    function render() {
      if (cancelled || !window.google?.accounts?.id || !googleContainerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });

      googleContainerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleContainerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 340,
        text: "continue_with",
      });

      setReady(true);
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

  return (
    <div className="google-signin-btn" aria-live="polite">
      <button
        type="button"
        className="btn btn--lg btn--google google-signin-btn__visual"
        disabled={disabled || !ready}
        tabIndex={-1}
        aria-hidden="true"
      >
        <GoogleLogo />
        <span className="btn__label">Continue with Google</span>
      </button>
      <div
        ref={googleContainerRef}
        className={`google-signin-btn__real${disabled ? " is-disabled" : ""}`}
      />
    </div>
  );
};

export default GoogleSignInButton;
