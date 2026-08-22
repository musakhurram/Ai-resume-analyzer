import "./Button.scss";

const Button = ({
  as: Component = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  children,
  className = "",
  ...rest
}) => {
  return (
    <Component
      className={`btn btn--${variant} btn--${size} ${loading ? "is-loading" : ""} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span className="btn__label">{children}</span>
    </Component>
  );
};

export default Button;
