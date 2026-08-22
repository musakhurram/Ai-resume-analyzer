import ThemeToggle from "../../../shared/components/ThemeToggle";
import { useTheme } from "../../../shared/hooks/useTheme";
import "./AuthLayout.scss";

const AuthLayout = ({ eyebrow, title, children }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="auth-layout">
      <aside className="auth-layout__brand">
        <div className="auth-layout__brand-top">
          <span className="auth-layout__mark" aria-hidden="true">
            <svg viewBox="0 0 28 28" fill="none">
              <rect x="1" y="1" width="26" height="26" rx="6" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 14h12M8 9.5h12M8 18.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <span className="auth-layout__wordmark">Resume Analyzer</span>
        </div>

        <div className="auth-layout__gauge" aria-hidden="true">
          <svg viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="78" className="auth-layout__gauge-track" />
            <circle cx="100" cy="100" r="78" className="auth-layout__gauge-arc" />
            {Array.from({ length: 24 }).map((_, i) => (
              <line
                key={i}
                x1="100"
                y1="10"
                x2="100"
                y2="18"
                transform={`rotate(${(360 / 24) * i} 100 100)`}
                className="auth-layout__gauge-tick"
              />
            ))}
          </svg>
        </div>

        <div className="auth-layout__copy">
          <p className="auth-layout__headline">
            Know where you stand before the interview does.
          </p>
          <p className="auth-layout__sub">
            Resume Analyzer compares your resume against the job, then builds the
            questions and prep plan that follow from it.
          </p>
        </div>

        <p className="auth-layout__foot eyebrow">Resume audit · Interview prep</p>
      </aside>

      <main className="auth-layout__panel">
        <div className="auth-layout__panel-top">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        <div className="auth-layout__form-wrap">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
