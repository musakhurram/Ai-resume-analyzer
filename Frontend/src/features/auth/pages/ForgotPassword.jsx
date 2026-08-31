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

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send the reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="Account recovery" title="Reset your password">
      <div className="forgot-password__intro">
        <div className="forgot-password__icon" aria-hidden="true">↗</div>
        <div>
          <p className="forgot-password__lead">Forgot your password?</p>
          <p className="forgot-password__description">
            Enter the email address linked to your account and we'll send you a secure reset link.
          </p>
        </div>
      </div>

      {message && (
        <Callout tone="success">
          <div className="auth-form__callout-content">
            <span>{message}</span>
          </div>
        </Callout>
      )}
      {error && <Callout tone="error">{error}</Callout>}

      <form className="auth-form forgot-password__form" onSubmit={submit} noValidate>
        <Field label="Account email" htmlFor="email" required>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="name@domain.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            required
            disabled={loading}
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          variant="primary"
          loading={loading}
          disabled={loading || !email.trim()}
          className="auth-form__submit"
        >
          {loading ? "Sending reset link…" : "Send reset link"}
        </Button>
      </form>

      <div className="forgot-password__back">
        <span aria-hidden="true">←</span>
        <Link to="/login">Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
