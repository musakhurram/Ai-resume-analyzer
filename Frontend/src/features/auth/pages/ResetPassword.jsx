import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import AuthLayout from "../components/AuthLayout";
import { Field, TextInput } from "../../../shared/components/Field";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import { resetPassword } from "../services/auth.api";
import "../auth.form.scss";

export default function ResetPassword() {
  const [params] = useSearchParams(); const navigate = useNavigate();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (e) => { e.preventDefault(); setError(""); if (!token) return setError("This password reset link is missing its token."); if (password.length < 8) return setError("Password must be at least 8 characters."); if (password !== confirm) return setError("Passwords do not match."); setLoading(true); try { const data = await resetPassword({ token, password }); setMessage(data.message); setTimeout(() => navigate("/login"), 1400); } catch (err) { setError(err.response?.data?.message || "Unable to reset your password."); } finally { setLoading(false); } };
  return <AuthLayout eyebrow="Account recovery" title="Create a new password">
    {message && <Callout tone="success">{message} Redirecting to sign in…</Callout>}{error && <Callout tone="error">{error}</Callout>}
    <form className="auth-form" onSubmit={submit} noValidate><Field label="New password" htmlFor="password" required><TextInput id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></Field><Field label="Confirm password" htmlFor="confirm" required><TextInput id="confirm" type="password" autoComplete="new-password" placeholder="Re-enter your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></Field><Button type="submit" size="lg" variant="primary" loading={loading} disabled={loading || !token || password.length < 8 || password !== confirm} className="auth-form__submit">{loading ? "Resetting…" : "Reset password"}</Button></form>
    <p className="auth-form__switch"><Link to="/login">Back to sign in</Link></p>
  </AuthLayout>;
}
