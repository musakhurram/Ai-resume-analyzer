import "./EmptyState.scss";

const EmptyState = ({ eyebrow, title, description, action }) => (
  <div className="empty-state">
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
    <h3 className="empty-state__title">{title}</h3>
    {description && <p className="empty-state__description">{description}</p>}
    {action && <div className="empty-state__action">{action}</div>}
  </div>
);

export default EmptyState;
