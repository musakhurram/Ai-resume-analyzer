import "./Callout.scss";

const ICONS = {
  info: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9v5M10 6.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 10.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 3.2L2.5 16.5h15L10 3.2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 8.5v3.5M10 14h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6.5v4.5M10 13.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

const Callout = ({
  tone = "info",
  title,
  children,
  onDismiss,
  className = "",
}) => (
  <div className={`callout callout--${tone} ${className}`} role={tone === "error" ? "alert" : "status"}>
    <div className="callout__icon" aria-hidden="true">
      {ICONS[tone] || ICONS.info}
    </div>
    <div className="callout__content">
      {title && <p className="callout__title">{title}</p>}
      {children && <div className="callout__body">{children}</div>}
    </div>
    {onDismiss && (
      <button
        type="button"
        className="callout__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    )}
  </div>
);

export default Callout;

