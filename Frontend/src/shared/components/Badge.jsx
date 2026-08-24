import "./Badge.scss";

const Badge = ({
  tone = "neutral",
  size = "md",
  dot = true,
  icon,
  className = "",
  children,
}) => (
  <span className={`badge badge--${tone} badge--${size} ${className}`}>
    {icon ? (
      <span className="badge__icon" aria-hidden="true">{icon}</span>
    ) : dot ? (
      <span className="badge__dot" aria-hidden="true" />
    ) : null}
    <span className="badge__label">{children}</span>
  </span>
);

export default Badge;

