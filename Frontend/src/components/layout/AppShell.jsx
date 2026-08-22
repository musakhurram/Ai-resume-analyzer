import { useState } from "react";
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

  return (
    <div className="app-shell">
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      {navOpen && (
        <button
          type="button"
          className="app-shell__scrim"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <div className="app-shell__main">
        <Topbar
          theme={theme}
          onToggleTheme={toggleTheme}
          user={user}
          onLogout={handleLogout}
          onMenuClick={() => setNavOpen(true)}
        />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
