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

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, handleLogin, handleGoogleAuth } = useAuth();
  const [email, setEmail] = useState(() => localStorage.getItem("ra_saved_email") || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem("ra_saved_email")));
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/analyze/ats-score" replace />;
  }

  const validateEmail = (val) => {
    if (!val) return "Email is required";
    if (!EMAIL_REGEX.test(val)) return "Please enter a valid email address";
    return "";
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
    if (emailError) setEmailError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const mailErr = validateEmail(email.trim());
    if (mailErr) { setEmailError(mailErr); return; }
    if (!password) { setError("Please enter your password"); return; }

    setSubmitting(true);
    try {
      if (rememberMe) localStorage.setItem("ra_saved_email", email.trim());
      else localStorage.removeItem("ra_saved_email");
      await handleLogin({ email: email.trim(), password });
      navigate("/analyze/ats-score");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid credentials. Please verify your email and password.");
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

  if (loading) return <PageLoader label="Verifying session credentials" />;

  return (
    <AuthLayout eyebrow="Welcome back" title="Sign in to your account">
      {error && <Callout tone="error"><div className="auth-form__callout-content"><span>{error}</span></div></Callout>}
      <GoogleSignInButton onCredential={handleGoogle} disabled={submitting} />
      <div className="auth-form__divider"><span>or sign in with email</span></div>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Field label="Email address" htmlFor="email" error={emailError} required>
          <TextInput id="email" name="email" type="email" autoComplete="email" autoFocus placeholder="name@domain.com" value={email} onChange={handleEmailChange} onBlur={() => setEmailError(validateEmail(email.trim()))} required disabled={submitting} />
        </Field>
        <Field label="Password" htmlFor="password" required>
          <TextInput id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={handlePasswordChange} required disabled={submitting} />
        </Field>
        <div className="auth-form__options"><label className="auth-form__checkbox-label"><input type="checkbox" className="auth-form__checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /><span>Remember email</span></label></div>
        <Button type="submit" size="lg" variant="primary" loading={submitting} disabled={submitting || !email.trim() || !password} className="auth-form__submit">{submitting ? "Authenticating…" : "Sign in"}</Button>
      </form>
      <p className="auth-form__switch">Don't have an account yet? <Link to="/register">Create an account</Link></p>
    </AuthLayout>
  );
};

export default Login;
