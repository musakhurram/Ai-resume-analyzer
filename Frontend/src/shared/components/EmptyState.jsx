import "./EmptyState.scss";

const EmptyState = ({
  icon,
  eyebrow,
  title,
  description,
  action,
  className = "",
}) => (
  <div className={`empty-state ${className}`}>
    <div className="empty-state__icon-box" aria-hidden="true">
      {icon || (
        <svg viewBox="0 0 24 24" fill="none" className="empty-state__default-icon">
          <path
            d="M9 12h6m-6 4h4m5 5H6a2 2 0 01-2-2V5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
    {eyebrow && <span className="empty-state__eyebrow eyebrow">{eyebrow}</span>}
    <h3 className="empty-state__title">{title}</h3>
    {description && <p className="empty-state__description">{description}</p>}
    {action && <div className="empty-state__action">{action}</div>}
  </div>
);

export default EmptyState;

