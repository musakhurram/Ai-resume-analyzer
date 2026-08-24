import ThemeToggle from "../../../shared/components/ThemeToggle";
import { useTheme } from "../../../shared/hooks/useTheme";
import { LogoMark } from "../../../shared/components/Logo";
import "./AuthLayout.scss";

const PRINCIPLES = [
  "Reads your resume the way an applicant tracking system does.",
  "Weighs it against the language of the specific role.",
  "Never uses your documents to train a model.",
];

const AuthLayout = ({ eyebrow, title, subtitle, children }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="auth-layout">
      {/* Left Column: brand + atmosphere, no data or metrics */}
      <aside className="auth-layout__brand" aria-label="Resume Analyzer">
        <div className="auth-layout__brand-top">
          <div className="auth-layout__brand-logo">
            <div className="auth-layout__mark" aria-hidden="true">
              <LogoMark className="auth-layout__mark-svg" />
            </div>
            <span className="auth-layout__wordmark">Resume Analyzer</span>
          </div>
        </div>

        {/* Abstract, honest document composition — no fabricated data */}
        <div className="auth-layout__composition" aria-hidden="true">
          <span className="auth-layout__ghost-word">Résumé</span>

          <div className="auth-layout__stack">
            <div className="auth-layout__sheet auth-layout__sheet--back" />
            <div className="auth-layout__sheet auth-layout__sheet--mid" />
            <div className="auth-layout__sheet auth-layout__sheet--front">
              <div className="auth-layout__doc-line auth-layout__doc-line--name" />
              <div className="auth-layout__doc-line auth-layout__doc-line--role" />
              <div className="auth-layout__doc-rule" />
              <div className="auth-layout__doc-line auth-layout__doc-line--w1" />
              <div className="auth-layout__doc-line auth-layout__doc-line--w2" />
              <div className="auth-layout__doc-line auth-layout__doc-line--w3 auth-layout__doc-line--accent" />
              <div className="auth-layout__doc-line auth-layout__doc-line--w2" />
              <div className="auth-layout__doc-rule" />
              <div className="auth-layout__doc-line auth-layout__doc-line--w1" />
              <div className="auth-layout__doc-line auth-layout__doc-line--w3" />
            </div>
          </div>
        </div>

        <div className="auth-layout__hero">
          <h2 className="auth-layout__headline">
            Make your resume stronger before it reaches a recruiter.
          </h2>
          <p className="auth-layout__sub">
            Resume Analyzer checks structure, keywords, and job alignment so you
            know exactly what to fix before you hit send.
          </p>
        </div>

        <ul className="auth-layout__points">
          {PRINCIPLES.map((text) => (
            <li key={text} className="auth-layout__point">
              <span className="auth-layout__point-mark" aria-hidden="true" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right Column: Clean Form Container */}
      <main className="auth-layout__panel">
        <header className="auth-layout__panel-top">
          <div className="auth-layout__mobile-brand">
            <div className="auth-layout__mark auth-layout__mark--sm" aria-hidden="true">
              <LogoMark className="auth-layout__mark-svg" />
            </div>
            <span className="auth-layout__wordmark">Resume Analyzer</span>
          </div>
          <div className="auth-layout__panel-actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <div className="auth-layout__form-wrap">
          <div className="auth-layout__form-header">
            {eyebrow && <span className="eyebrow auth-layout__eyebrow">{eyebrow}</span>}
            <h1 className="auth-layout__title">{title}</h1>
            {subtitle && <p className="auth-layout__form-desc">{subtitle}</p>}
          </div>

          <div className="auth-layout__form-card">{children}</div>

          <p className="auth-layout__secure-note">
            <svg viewBox="0 0 16 16" fill="none" className="auth-layout__secure-icon" aria-hidden="true">
              <rect x="3" y="6" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M5 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span>Your resume is encrypted &amp; never used to train a model</span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
