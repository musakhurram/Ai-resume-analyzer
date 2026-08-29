import { useEffect, useRef, useState } from "react";
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
  const touchStart = useRef(null);

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

  // Native-feeling edge swipe: swipe right from the left edge to open,
  // or swipe left while the drawer is open to close it.
  const handleTouchStart = (event) => {
    if (window.innerWidth > 900 || !event.touches[0]) return;
    const touch = event.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      edge: touch.clientX <= 28,
    };
  };

  const handleTouchEnd = (event) => {
    if (window.innerWidth > 900 || !touchStart.current || !event.changedTouches[0]) return;

    const start = touchStart.current;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    touchStart.current = null;

    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.2) return;

    if (!navOpen && start.edge && dx > 0) {
      setNavOpen(true);
    } else if (navOpen && dx < 0) {
      setNavOpen(false);
    }
  };

  return (
    <div
      className={`app-shell${navOpen ? " is-nav-open" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
