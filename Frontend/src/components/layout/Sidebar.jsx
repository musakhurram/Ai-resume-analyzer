import { NavLink, Link, useLocation } from "react-router";
import { LogoMark } from "../../shared/components/Logo";
import "./Sidebar.scss";

const navItems = [
  {
    to: "/new",
    alias: ["/", "/new", "/app", "/review"],
    label: "New Review",
    badge: "Studio",
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <path
          d="M10 4.167v11.666M4.167 10h11.666"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/reports",
    alias: ["/reports"],
    label: "Past Reports",
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <path
          d="M6.667 3.333H13.333L16.667 6.667V15.833A1.667 1.667 0 0 1 15 17.5H5A1.667 1.667 0 0 1 3.333 15.833V5A1.667 1.667 0 0 1 5 3.333H6.667Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M7.5 10.833h5M7.5 14.167h5M7.5 7.5h2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

const Sidebar = ({ open, onNavigate, onClose }) => {
  const location = useLocation();

  return (
    <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Main sidebar">
      <div className="sidebar__header">
        <Link to="/new" className="sidebar__brand" onClick={onNavigate}>
          <div className="sidebar__mark" aria-hidden="true">
            <LogoMark className="sidebar__logo-svg" />
          </div>
          <div className="sidebar__brand-text">
            <span className="sidebar__wordmark">Resume Analyzer</span>
            <span className="sidebar__tagline">Interview Studio</span>
          </div>
        </Link>

        {open && (
          <button
            type="button"
            className="sidebar__close-btn"
            onClick={onClose || onNavigate}
            aria-label="Close sidebar"
          >
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <nav className="sidebar__nav" aria-label="Primary Navigation">
        <p className="sidebar__section-title">Navigation</p>
        {navItems.map((item) => {
          const isActive = item.alias.some(
            (p) => location.pathname === p || (p !== "/" && location.pathname.startsWith(p)),
          );

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`sidebar__link ${isActive ? "is-active" : ""}`}
              onClick={onNavigate}
            >
              <span className="sidebar__link-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="sidebar__link-text">{item.label}</span>
              {item.badge && <span className="sidebar__link-badge">{item.badge}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__status-card">
          <div className="sidebar__status-header">
            <span className="sidebar__status-dot" aria-hidden="true" />
            <span className="sidebar__status-title">AI Engine Active</span>
          </div>
          <p className="sidebar__status-desc">Ready to evaluate resume-job compatibility</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;


