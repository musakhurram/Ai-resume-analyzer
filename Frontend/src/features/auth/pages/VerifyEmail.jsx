import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import AuthLayout from "../components/AuthLayout";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import { verifyEmail } from "../services/auth.api";
import "../auth.form.scss";

export default function VerifyEmail() {
  const [params] = useSearchParams(); const token = params.get("token") || ""; const [state, setState] = useState({ loading: true, message: "", error: "" });
  useEffect(() => { if (!token) { setState({ loading: false, message: "", error: "This verification link is missing its token." }); return; } verifyEmail(token).then((data) => setState({ loading: false, message: data.message, error: "" })).catch((err) => setState({ loading: false, message: "", error: err.response?.data?.message || "Unable to verify this email." })); }, [token]);
  return <AuthLayout eyebrow="Email verification" title={state.loading ? "Verifying your email…" : state.message ? "Email verified" : "Verification failed"}>
    {state.loading && <p>Please wait while we confirm your email address.</p>}{state.message && <Callout tone="success">{state.message}</Callout>}{state.error && <Callout tone="error">{state.error}</Callout>}
    <Link to="/login"><Button size="lg" variant="primary">Continue to sign in</Button></Link>
  </AuthLayout>;
}
