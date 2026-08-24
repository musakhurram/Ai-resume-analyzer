import { useState } from "react";
import "./Field.scss";

export const Field = ({
  label,
  htmlFor,
  hint,
  error,
  action,
  required,
  className = "",
  children,
}) => (
  <div className={`field ${error ? "field--error" : ""} ${className}`}>
    {(label || action) && (
      <div className="field__header">
        {label && (
          <label className="field__label" htmlFor={htmlFor}>
            {label}
            {required && <span className="field__required" aria-hidden="true">*</span>}
          </label>
        )}
        {action && <div className="field__action">{action}</div>}
      </div>
    )}
    <div className="field__body">{children}</div>
    {error ? (
      <p className="field__message field__message--error" role="alert">
        <svg viewBox="0 0 16 16" fill="none" className="field__message-icon" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 4.5v4.5M8 11.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>{error}</span>
      </p>
    ) : hint ? (
      <p className="field__message">{hint}</p>
    ) : null}
  </div>
);

export const TextInput = ({
  iconLeft,
  iconRight,
  type = "text",
  className = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`input-wrapper ${iconLeft ? "has-icon-left" : ""} ${isPassword || iconRight ? "has-icon-right" : ""}`}>
      {iconLeft && <span className="input-icon input-icon--left" aria-hidden="true">{iconLeft}</span>}
      <input className={`field__control ${className}`} type={effectiveType} {...props} />
      {isPassword ? (
        <button
          type="button"
          className="input-password-toggle"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 3l14 14M8.35 8.35A3 3 0 0012.65 12.65M6.2 6.2C4.1 7.4 2.5 10 2.5 10s3 5.5 7.5 5.5c1.6 0 3-.7 4.2-1.7M10 4.5c4.5 0 7.5 5.5 7.5 5.5s-.9 1.6-2.3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M2.5 10s3-5.5 7.5-5.5 7.5 5.5 7.5 5.5-3 5.5-7.5 5.5S2.5 10 2.5 10Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
        </button>
      ) : (
        iconRight && <span className="input-icon input-icon--right" aria-hidden="true">{iconRight}</span>
      )}
    </div>
  );
};

export const TextArea = ({ rows = 6, count, maxCount, className = "", ...props }) => (
  <div className="textarea-wrapper">
    <textarea className={`field__control field__control--textarea ${className}`} rows={rows} {...props} />
    {maxCount && (
      <div className="field__counter">
        {count ?? 0} / {maxCount}
      </div>
    )}
  </div>
);

