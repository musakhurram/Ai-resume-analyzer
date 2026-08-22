import "./Badge.scss";

const Badge = ({ tone = "neutral", children }) => (
  <span className={`badge badge--${tone}`}>{children}</span>
);

export default Badge;
