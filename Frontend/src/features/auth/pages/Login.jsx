import { useState } from "react";
import { Link, useNavigate } from "react-router";
import AuthLayout from "../components/AuthLayout";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { Field, TextInput } from "../../../shared/components/Field";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import PageLoader from "../../../shared/components/PageLoader";
import { useAuth } from "../hooks/useAuth";
import "../auth.form.scss";

const Login = () => {
  const navigate = useNavigate();
  const { loading, handleLogin, handleGoogleAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await handleLogin({ email, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async (credential) => {
    setError("");
    try {
      await handleGoogleAuth(credential);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Google sign-in failed");
    }
  };

  if (loading) {
    return <PageLoader label="Checking your session" />;
  }

  return (
    <AuthLayout eyebrow="Welcome back" title="Sign in">
      {error && <Callout tone="error">{error}</Callout>}

      <GoogleSignInButton onCredential={handleGoogle} disabled={submitting} />

      <div className="auth-form__divider">
        <span>or continue with email</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Email" htmlFor="email">
          <TextInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <Button type="submit" size="lg" loading={submitting} className="auth-form__submit">
          Sign in
        </Button>
      </form>

      <p className="auth-form__switch">
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
