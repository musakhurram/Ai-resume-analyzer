import "./Button.scss";

const Button = ({
  as: Component = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
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
      {loading ? (
        <span className="btn__spinner" aria-hidden="true" />
      ) : iconLeft ? (
        <span className="btn__icon btn__icon--left" aria-hidden="true">
          {iconLeft}
        </span>
      ) : null}
      <span className="btn__label">{children}</span>
      {!loading && iconRight && (
        <span className="btn__icon btn__icon--right" aria-hidden="true">
          {iconRight}
        </span>
      )}
    </Component>
  );
};

export default Button;

