import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import AuthLayout from "../components/AuthLayout";
import Callout from "../../../shared/components/Callout";
import { verifyEmail } from "../services/auth.api";
import "../auth.form.scss";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [state, setState] = useState({ loading: Boolean(token), message: "", error: "" });

  useEffect(() => {
    if (!token) {
      setState({ loading: false, message: "", error: "This verification link is missing or invalid." });
      return;
    }

    let active = true;
    verifyEmail(token)
      .then((data) => {
        if (!active) return;
        localStorage.removeItem("ra_pending_verification_email");
        setState({ loading: false, message: data?.message || "Your email has been verified.", error: "" });
        // Give the user a brief confirmation, then return directly to pricing.
        window.setTimeout(() => navigate("/pricing", { replace: true }), 900);
      })
      .catch((err) => {
        if (!active) return;
        setState({ loading: false, message: "", error: err.response?.data?.message || "Unable to verify this email." });
      });

    return () => {
      active = false;
    };
  }, [token, navigate]);

  return (
    <AuthLayout
      eyebrow="Email verification"
      title={state.loading ? "Verifying your email…" : state.message ? "Email verified" : "Verification failed"}
    >
      {state.loading && <p>Please wait while we confirm your email address.</p>}
      {state.message && (
        <>
          <Callout tone="success">{state.message}</Callout>
          <p>Taking you back to Plans & Billing…</p>
        </>
      )}
      {state.error && <Callout tone="error">{state.error}</Callout>}
      {state.error && (
        <p className="auth-form__switch">
          Please return to the pricing page and request a new verification email.
        </p>
      )}
    </AuthLayout>
  );
}
