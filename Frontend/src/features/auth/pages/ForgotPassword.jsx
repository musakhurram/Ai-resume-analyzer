import { useState } from "react";
import { Link } from "react-router";
import AuthLayout from "../components/AuthLayout";
import { Field, TextInput } from "../../../shared/components/Field";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import { forgotPassword } from "../services/auth.api";
import "../auth.form.scss";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => { e.preventDefault(); setError(""); setMessage(""); setLoading(true); try { const data = await forgotPassword(email.trim()); setMessage(data.message); } catch (err) { setError(err.response?.data?.message || "Unable to send the reset email."); } finally { setLoading(false); } };
  return <AuthLayout eyebrow="Account recovery" title="Forgot your password?">
    {message && <Callout tone="success">{message}</Callout>}{error && <Callout tone="error">{error}</Callout>}
    <form className="auth-form" onSubmit={submit} noValidate><Field label="Email address" htmlFor="email" required><TextInput id="email" type="email" autoComplete="email" placeholder="you@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field><Button type="submit" size="lg" variant="primary" loading={loading} disabled={loading || !email.trim()} className="auth-form__submit">{loading ? "Sending…" : "Send reset link"}</Button></form>
    <p className="auth-form__switch"><Link to="/login">Back to sign in</Link></p>
  </AuthLayout>;
}
