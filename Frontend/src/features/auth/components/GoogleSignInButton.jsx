import { useEffect, useRef, useState } from "react";
import "./GoogleSignInButton.scss";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleSignInButton = ({ onCredential, disabled }) => {
  const googleContainerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || disabled) return;

    let cancelled = false;
    let interval;

    const renderGoogleButton = () => {
      if (
        cancelled ||
        !window.google?.accounts?.id ||
        !googleContainerRef.current
      ) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response?.credential) {
            onCredential(response.credential);
          }
        },
      });

      googleContainerRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(
        googleContainerRef.current,
        {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 340,
        }
      );

      setReady(true);
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderGoogleButton();
        }
      }, 150);
    }

    return () => {
      cancelled = true;

      if (interval) {
        clearInterval(interval);
      }
    };
  }, [disabled, onCredential]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div
      className={`google-signin-btn ${
        !ready ? "is-loading" : ""
      } ${disabled ? "is-disabled" : ""}`}
    >
      <div
        ref={googleContainerRef}
        className="google-signin-btn__container"
      />
    </div>
  );
};

export default GoogleSignInButton;