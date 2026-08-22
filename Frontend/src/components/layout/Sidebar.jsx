import { NavLink } from "react-router";
import "./Sidebar.scss";

const navItems = [
  {
    to: "/",
    label: "New review",
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/reports",
    label: "Past reports",
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <path
          d="M5 3h7l3 3v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M7 10h6M7 13h6M7 7h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

const Sidebar = ({ open, onNavigate }) => {
  return (
    <aside className={`sidebar ${open ? "is-open" : ""}`}>
      <div className="sidebar__brand">
        <span className="sidebar__mark" aria-hidden="true">
          <svg viewBox="0 0 28 28" fill="none">
            <rect x="1" y="1" width="26" height="26" rx="6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 14h12M8 9.5h12M8 18.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <p className="sidebar__wordmark">Docket</p>
          <p className="sidebar__tagline eyebrow">Interview readiness</p>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => `sidebar__link ${isActive ? "is-active" : ""}`}
            onClick={onNavigate}
          >
            <span className="sidebar__link-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <p className="eyebrow">Docket · Resume audit tool</p>
      </div>
    </aside>
  );
};

export default Sidebar;
