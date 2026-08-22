import { useState } from "react";
import { Link, useNavigate } from "react-router";
import AuthLayout from "../components/AuthLayout";
import { Field, TextInput } from "../../../shared/components/Field";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import PageLoader from "../../../shared/components/PageLoader";
import { useAuth } from "../hooks/useAuth";
import "../auth.form.scss";

const Register = () => {
  const navigate = useNavigate();
  const { loading, handleRegister } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await handleRegister({ username, email, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader label="Setting things up" />;
  }

  return (
    <AuthLayout eyebrow="Get started" title="Create your account">
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <Callout tone="error">{error}</Callout>}

        <Field label="Username" htmlFor="username">
          <TextInput
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </Field>

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

        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </Field>

        <Button type="submit" size="lg" loading={submitting} className="auth-form__submit">
          Create account
        </Button>
      </form>

      <p className="auth-form__switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
