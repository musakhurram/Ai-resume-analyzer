import ThemeToggle from "../../shared/components/ThemeToggle";
import "./Topbar.scss";

function initialsFor(name) {
  if (!name) return "?";
  return name.slice(0, 2).toUpperCase();
}

const Topbar = ({ theme, onToggleTheme, user, onLogout, onMenuClick }) => {
  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar__menu"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <div className="topbar__spacer" />

      <ThemeToggle theme={theme} onToggle={onToggleTheme} />

      <div className="topbar__account">
        <span className="topbar__avatar" aria-hidden="true">
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initialsFor(user?.username)}
        </span>
        <span className="topbar__username">{user?.username}</span>
        <button type="button" className="topbar__logout" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </header>
  );
};

export default Topbar;
