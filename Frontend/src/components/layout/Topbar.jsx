import { useLocation } from "react-router";
import ThemeToggle from "../../shared/components/ThemeToggle";
import { LogoMark } from "../../shared/components/Logo";
import "./Topbar.scss";

function initialsFor(name) {
  if (!name) return "U";
  return name.slice(0, 2).toUpperCase();
}

function getLocationContext(pathname) {
  if (pathname.startsWith("/reports/")) return "Candidate Dossier";
  if (pathname.startsWith("/reports")) return "Archived Dossiers";
  return "New Candidate Review";
}

const Topbar = ({ theme, onToggleTheme, user, onLogout, onMenuClick, navOpen = false }) => {
  const location = useLocation();
  const contextLabel = getLocationContext(location.pathname);

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar__menu"
        onClick={onMenuClick}
        aria-label={navOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={navOpen}
        aria-controls="main-navigation"
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          {navOpen ? (
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          ) : (
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
      </button>

      <div className="topbar__mobile-brand" aria-label="AI Resume Analyzer">
        <span className="topbar__mobile-brand-mark"><LogoMark /></span>
        <span className="topbar__mobile-brand-text"><span className="topbar__mobile-brand-name">AI Resume</span><span className="topbar__mobile-brand-sub">Analyzer</span></span>
      </div>

      <div className="topbar__context">
        <span className="topbar__badge">Workspace</span>
        <span className="topbar__divider">/</span>
        <span className="topbar__location">{contextLabel}</span>
      </div>

      <div className="topbar__spacer" />

      <div className="topbar__actions">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <div className="topbar__account">
          <div className="topbar__user-chip" title={user?.email || user?.username}>
            <span className="topbar__avatar" aria-hidden="true">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initialsFor(user?.username)}
            </span>
            <div className="topbar__user-meta">
              <span className="topbar__username">{user?.username || "Candidate"}</span>
              <span className="topbar__user-role">Candidate</span>
            </div>
          </div>

          <button
            type="button"
            className="topbar__logout"
            onClick={onLogout}
            title="Sign out of your account"
            aria-label="Sign out of your account"
          >
            <svg viewBox="0 0 16 16" fill="none" className="topbar__logout-icon" aria-hidden="true">
              <path d="M6 13.5H3.5a1 1 0 01-1-1v-9a1 1 0 011-1H6M10.5 11l3-3-3-3M13.5 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="topbar__logout-label">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
