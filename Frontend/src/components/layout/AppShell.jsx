import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useTheme } from "../../shared/hooks/useTheme";
import { useAuth } from "../../features/auth/hooks/useAuth";
import "./AppShell.scss";

const AppShell = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, handleLogout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setNavOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navOpen]);

  const closeNavigation = () => setNavOpen(false);

  return (
    <div className={`app-shell${navOpen ? " is-nav-open" : ""}`}>
      <Sidebar
        open={navOpen}
        onNavigate={closeNavigation}
        onClose={closeNavigation}
      />

      <button
        type="button"
        className={`app-shell__scrim${navOpen ? " is-visible" : ""}`}
        aria-label="Close navigation"
        aria-hidden={!navOpen}
        tabIndex={navOpen ? 0 : -1}
        onClick={closeNavigation}
      />

      <div className="app-shell__main">
        <Topbar
          theme={theme}
          onToggleTheme={toggleTheme}
          user={user}
          onLogout={handleLogout}
          onMenuClick={() => setNavOpen((open) => !open)}
          navOpen={navOpen}
        />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
