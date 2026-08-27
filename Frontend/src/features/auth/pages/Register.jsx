import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router";
import AuthLayout from "../components/AuthLayout";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { Field, TextInput } from "../../../shared/components/Field";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import PageLoader from "../../../shared/components/PageLoader";
import { useAuth } from "../hooks/useAuth";
import "../auth.form.scss";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function computePasswordStrength(pass) {
  if (!pass) return { score: 0, label: "None", tone: "faint", percent: 0 };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (pass.length >= 12) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;
  if (score <= 1) return { score: 1, label: "Weak", tone: "error", percent: 25 };
  if (score === 2) return { score: 2, label: "Fair", tone: "warning", percent: 50 };
  if (score === 3 || score === 4) return { score: 3, label: "Strong", tone: "accent", percent: 75 };
  return { score: 4, label: "Exceptional", tone: "success", percent: 100 };
}

const Register = () => {
  const navigate = useNavigate();
  const { user, loading, handleRegister, handleGoogleAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/analyze/ats-score" replace />;

  const strength = computePasswordStrength(password);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || username.trim().length < 3) { setError("Username must be at least 3 characters"); return; }
    if (!EMAIL_REGEX.test(email.trim())) { setEmailError("Please enter a valid email address"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters long"); return; }
    if (confirmPassword && password !== confirmPassword) { setError("Passwords do not match"); return; }

    setSubmitting(true);
    try {
      await handleRegister({ username: username.trim(), email: email.trim(), password });
      navigate("/analyze/ats-score");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed. An account may already exist with this email or username.");
    } finally { setSubmitting(false); }
  };

  const handleGoogle = async (credential) => {
    setError("");
    try {
      await handleGoogleAuth(credential);
      navigate("/analyze/ats-score");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Google sign-in failed. Please try again.");
    }
  };

  if (loading) return <PageLoader label="Configuring your workspace" />;

  const canSubmit = username.trim().length >= 3 && email.trim().length > 0 && password.length >= 8 && (!confirmPassword || passwordsMatch) && !submitting;

  return (
    <AuthLayout eyebrow="Get started" title="Create your account">
      {error && <Callout tone="error">{error}</Callout>}
      <GoogleSignInButton onCredential={handleGoogle} disabled={submitting} />
      <div className="auth-form__divider"><span>or register with email</span></div>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Field label="Username" htmlFor="username" hint="Minimum 3 characters" required><TextInput id="username" name="username" type="text" autoComplete="username" autoFocus placeholder="johndoe" value={username} onChange={(e) => { setUsername(e.target.value); if (error) setError(""); }} required disabled={submitting} /></Field>
        <Field label="Email address" htmlFor="email" error={emailError} required><TextInput id="email" name="email" type="email" autoComplete="email" placeholder="you@domain.com" value={email} onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); if (error) setError(""); }} onBlur={() => { if (email.trim() && !EMAIL_REGEX.test(email.trim())) setEmailError("Please enter a valid email address"); }} required disabled={submitting} /></Field>
        <Field label="Password" htmlFor="password" required>
          <TextInput id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }} required minLength={8} disabled={submitting} />
          {password.length > 0 && <div className="auth-form__strength"><div className="auth-form__strength-header"><span className="auth-form__strength-label">Password Strength:</span><span className={`auth-form__strength-value auth-form__strength-value--${strength.tone}`}>{strength.label}</span></div><div className="auth-form__strength-bar"><div className={`auth-form__strength-fill auth-form__strength-fill--${strength.tone}`} style={{ width: `${strength.percent}%` }} /></div></div>}
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" error={passwordsMismatch ? "Passwords do not match" : null} hint={passwordsMatch ? "✓ Passwords match" : null}><TextInput id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(""); }} disabled={submitting} /></Field>
        <Button type="submit" size="lg" variant="primary" loading={submitting} disabled={!canSubmit} className="auth-form__submit">{submitting ? "Creating workspace…" : "Create Account"}</Button>
      </form>
      <p className="auth-form__switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  );
};

export default Register;
