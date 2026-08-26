import { useState, useEffect } from "react";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import "./AtsBeforeAfterPreview.scss";

const SECTIONS_AVAILABLE = [
  { id: "all", label: "All Sections (Full Rewrite)" },
  { id: "summary", label: "Professional Summary" },
  { id: "experience", label: "Work Experience & Action Bullets" },
  { id: "skills", label: "Skills Taxonomy & Categories" },
  { id: "education", label: "Education & Details" },
];

const ACTION_VERBS = new Set([
  "Architected", "Engineered", "Spearheaded", "Optimized", "Implemented", "Scaled",
  "Designed", "Built", "Developed", "Led", "Pioneered", "Orchestrated", "Streamlined",
  "Automated", "Transformed", "Accelerated", "Delivered", "Refactored", "Deployed",
  "Constructed", "Established", "Formulated", "Modernized", "Reduced", "Increased",
  "Saved", "Negotiated", "Standardized", "Programmed", "Author", "Authored", "Mentored",
  "Spearhead", "Championed", "Overhauled", "Enhanced", "Created", "Executed"
]);

function highlightBulletContent(bullet = "") {
  if (!bullet) return null;
  const words = bullet.split(" ");
  if (words.length === 0) return bullet;

  const firstWord = words[0].replace(/[^a-zA-Z]/g, "");
  const isActionVerb = ACTION_VERBS.has(firstWord);

  return (
    <span>
      {isActionVerb ? (
        <span className="ats-diff-verb" title="AI action verb improvement">
          {words[0]}{" "}
        </span>
      ) : (
        words[0] + " "
      )}
      {words.slice(1).map((w, i) => {
        const isMetric = /[\$€£]?\d+(\.\d+)?%?[\+xX]?|\b\d+([kKmMbB])\b/.test(w);
        if (isMetric) {
          return (
            <span key={i} className="ats-diff-metric" title="Preserved metric">
              {w}{" "}
            </span>
          );
        }
        return w + " ";
      })}
    </span>
  );
}

const AtsBeforeAfterPreview = ({
  reportId,
  originalText,
  originalPdfUrl,
  revisedResume,
  loading,
  error,
  onRevise,
  onDownload,
  downloading,
}) => {
  const [selectedSection, setSelectedSection] = useState("all");
  const [customNotes, setCustomNotes] = useState("");
  const [leftMode, setLeftMode] = useState(originalPdfUrl ? "pdf" : "text");
  const [rightMode, setRightMode] = useState("diff");
  const [showDiffHighlights, setShowDiffHighlights] = useState(true);

  useEffect(() => {
    if (originalPdfUrl && leftMode === "text") {
      setLeftMode("pdf");
    }
  }, [originalPdfUrl]);

  const handleRunRevise = () => {
    onRevise({
      sections: selectedSection,
      customNotes,
    });
  };

  const contact = revisedResume?.contact || {};
  const summary = revisedResume?.summary || "";
  const experience = Array.isArray(revisedResume?.experience) ? revisedResume.experience : [];
  const skills = Array.isArray(revisedResume?.skills) ? revisedResume.skills : [];
  const education = Array.isArray(revisedResume?.education) ? revisedResume.education : [];
  const projects = Array.isArray(revisedResume?.projects) ? revisedResume.projects : [];
  const certifications = Array.isArray(revisedResume?.certifications) ? revisedResume.certifications : [];

  return (
    <div className="ats-preview-modal glass-panel">
      <div className="ats-preview-modal__header">
        <div className="ats-preview-modal__titles">
          <div className="glow-pill">
            <span className="glow-pill__dot" />
            <span>AI REVISION STUDIO</span>
          </div>
          <h2 className="ats-preview-modal__title">See What Changed in Your Resume</h2>
          <p className="ats-preview-modal__desc">
            Compare the original resume with the AI-revised version. The revised pane highlights
            stronger wording, preserved metrics, and ATS-focused improvements.
          </p>
        </div>

        <div className="ats-preview-modal__actions">
          {revisedResume && (
            <Button
              variant="primary"
              size="md"
              loading={downloading}
              onClick={() => onDownload(reportId, contact.fullName)}
              className="ats-preview-modal__download-btn"
            >
              <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
                <path
                  d="M8 2v8m0 0 3-3m-3 3-3-3M3 12v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download ATS PDF
            </Button>
          )}
        </div>
      </div>

      {error && <Callout tone="error" title="Revision Issue">{error}</Callout>}

      <div className="ats-preview-toolbar">
        <div className="ats-preview-toolbar__row">
          <div className="ats-preview-toolbar__section-picker">
            <label htmlFor="sectionSelect" className="ats-toolbar-label">Scope:</label>
            <select
              id="sectionSelect"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="ats-toolbar-select"
              disabled={loading}
            >
              {SECTIONS_AVAILABLE.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="ats-preview-toolbar__custom-notes">
            <input
              type="text"
              placeholder="Optional rewrite focus (e.g. emphasize cloud, leadership)..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="ats-toolbar-input"
              disabled={loading}
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            onClick={handleRunRevise}
            className="ats-toolbar-btn"
          >
            {revisedResume ? "Re-generate" : "Generate Revision"}
          </Button>
        </div>
      </div>

      {rightMode === "diff" && showDiffHighlights && revisedResume && (
        <div className="ats-diff-legend">
          <span className="ats-diff-legend__title">What the AI improved:</span>
          <div className="ats-diff-legend__items">
            <span className="ats-legend-chip ats-legend-chip--verb">
              <span className="ats-legend-dot ats-legend-dot--verb" />
              Stronger action verbs
            </span>
            <span className="ats-legend-chip ats-legend-chip--metric">
              <span className="ats-legend-dot ats-legend-dot--metric" />
              Preserved metrics
            </span>
            <span className="ats-legend-chip ats-legend-chip--tax">
              <span className="ats-legend-dot ats-legend-dot--tax" />
              ATS keywords
            </span>
            <span className="ats-legend-chip ats-legend-chip--clean">
              <span className="ats-legend-dot ats-legend-dot--clean" />
              Facts preserved
            </span>
          </div>

          <label className="ats-diff-toggle">
            <input
              type="checkbox"
              checked={showDiffHighlights}
              onChange={(e) => setShowDiffHighlights(e.target.checked)}
            />
            <span>Show highlights</span>
          </label>
        </div>
      )}

      <div className="ats-preview-panes ats-preview-panes--split">
        <div className="ats-pane ats-pane--original">
          <div className="ats-pane__head">
            <div className="ats-pane__head-left">
              <span className="ats-pane__tag">BEFORE</span>
              <h3 className="ats-pane__title">Original Resume</h3>
            </div>

            <div className="ats-pane-view-tabs" aria-label="Original resume view">
              {originalPdfUrl && (
                <button
                  type="button"
                  className={`ats-pane-tab-btn ${leftMode === "pdf" ? "is-active" : ""}`}
                  onClick={() => setLeftMode("pdf")}
                >
                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
                    <path d="M4 2.5h5l3 3V13.5H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M9 2.5v3h3M6 9h4M6 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  PDF View
                </button>
              )}
              <button
                type="button"
                className={`ats-pane-tab-btn ${leftMode === "text" ? "is-active" : ""}`}
                onClick={() => setLeftMode("text")}
              >
                <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
                  <path d="M3 3.5h10M3 6.5h10M3 9.5h7M3 12.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Text View
              </button>
            </div>
          </div>

          <div className="ats-pane__body ats-pane__body--original">
            {leftMode === "pdf" && originalPdfUrl ? (
              <div className="ats-iframe-container">
                <iframe
                  src={originalPdfUrl}
                  title="Original Uploaded PDF"
                  className="ats-preview-iframe"
                />
              </div>
            ) : (
              <div className="ats-pane__body--raw">
                <pre>{originalText || "No original text available."}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="ats-pane ats-pane--revised">
          <div className="ats-pane__head">
            <div className="ats-pane__head-left">
              <span className="ats-pane__tag ats-pane__tag--accent">AFTER</span>
              <h3 className="ats-pane__title">AI Revised Resume</h3>
            </div>

            <div className="ats-pane-head-actions">
              <div className="ats-pane-view-tabs" aria-label="Revised resume view">
                <button
                  type="button"
                  className={`ats-pane-tab-btn ${rightMode === "diff" ? "is-active" : ""}`}
                  onClick={() => setRightMode("diff")}
                  title="See AI improvements and highlights"
                >
                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
                    <path d="M3 4.5h10M3 8h7M3 11.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    <path d="m11.5 9.5 1 1 1.8-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Changes
                </button>
                <button
                  type="button"
                  className={`ats-pane-tab-btn ${rightMode === "clean" ? "is-active" : ""}`}
                  onClick={() => setRightMode("clean")}
                  title="Review the final revised resume"
                >
                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
                    <path d="M4 2.5h5l3 3v8H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M9 2.5v3h3M6 9h4M6 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Clean View
                </button>
              </div>
            </div>
          </div>

          <div className="ats-pane__body ats-pane__body--revised-wrap">
            {loading ? (
              <div className="ats-pane-loading">
                <div className="ats-spinner" />
                <p>Preparing your revised resume…</p>
                <span>Strengthening wording while preserving your original facts.</span>
              </div>
            ) : !revisedResume ? (
              <div className="ats-pane-prompt">
                <p>Generate a revision to see the improvements here.</p>
              </div>
            ) : (
              <div className={`ats-pane__body--document ${showDiffHighlights && rightMode === "diff" ? "has-diff-mode" : ""}`}>
                <div className="ats-resume-doc">
                  <div className="ats-doc__header">
                    <h1 className="ats-doc__name">{contact.fullName || "Candidate Name"}</h1>
                    <div className="ats-doc__contact-row">
                      {[
                        contact.email,
                        contact.phone,
                        contact.location,
                        contact.linkedin,
                        contact.github,
                        contact.website,
                      ]
                        .filter(Boolean)
                        .map((c, i) => (
                          <span key={i} className="ats-doc__contact-item">
                            {c}
                          </span>
                        ))}
                    </div>
                  </div>

                  {summary && (
                    <div className={`ats-doc__section ${showDiffHighlights && rightMode === "diff" ? "ats-diff-section" : ""}`}>
                      <div className="ats-doc__sec-header">
                        <h2 className="ats-doc__sec-title">Professional Summary</h2>
                        {showDiffHighlights && rightMode === "diff" && (
                          <span className="ats-diff-chip ats-diff-chip--ai">Improved</span>
                        )}
                      </div>
                      <p className="ats-doc__summary-text">{summary}</p>
                    </div>
                  )}

                  {skills.length > 0 && (
                    <div className={`ats-doc__section ${showDiffHighlights && rightMode === "diff" ? "ats-diff-section" : ""}`}>
                      <div className="ats-doc__sec-header">
                        <h2 className="ats-doc__sec-title">Technical Skills</h2>
                        {showDiffHighlights && rightMode === "diff" && (
                          <span className="ats-diff-chip ats-diff-chip--tax">ATS Grouped</span>
                        )}
                      </div>
                      {skills.map((s, idx) => (
                        <div key={idx} className="ats-doc__skill-row">
                          <strong className="ats-doc__skill-cat">{s.category}: </strong>
                          <span className="ats-doc__skill-items">
                            {Array.isArray(s.items) ? s.items.join(", ") : s.items}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {experience.length > 0 && (
                    <div className="ats-doc__section">
                      <div className="ats-doc__sec-header">
                        <h2 className="ats-doc__sec-title">Professional Experience</h2>
                        {showDiffHighlights && rightMode === "diff" && (
                          <span className="ats-diff-chip ats-diff-chip--verb">Stronger wording</span>
                        )}
                      </div>
                      {experience.map((exp, idx) => (
                        <div key={idx} className="ats-doc__exp-item">
                          <div className="ats-doc__exp-header">
                            <div>
                              <strong className="ats-doc__company">{exp.company}</strong>
                              {exp.title && <span className="ats-doc__role"> — {exp.title}</span>}
                            </div>
                            <span className="ats-doc__dates">{exp.dates}</span>
                          </div>
                          {exp.location && <div className="ats-doc__loc">{exp.location}</div>}
                          {Array.isArray(exp.bullets) && exp.bullets.length > 0 && (
                            <ul className="ats-doc__bullets">
                              {exp.bullets.map((b, bi) => (
                                <li key={bi} className={showDiffHighlights && rightMode === "diff" ? "ats-diff-bullet" : ""}>
                                  {showDiffHighlights && rightMode === "diff"
                                    ? highlightBulletContent(b)
                                    : b}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {education.length > 0 && (
                    <div className="ats-doc__section">
                      <h2 className="ats-doc__sec-title">Education</h2>
                      {education.map((edu, idx) => (
                        <div key={idx} className="ats-doc__edu-item">
                          <div className="ats-doc__exp-header">
                            <div>
                              <strong className="ats-doc__company">{edu.degree}</strong>
                              {edu.institution && <span className="ats-doc__role"> — {edu.institution}</span>}
                            </div>
                            <span className="ats-doc__dates">{edu.dates}</span>
                          </div>
                          {edu.details && <div className="ats-doc__details">{edu.details}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {projects.length > 0 && (
                    <div className="ats-doc__section">
                      <h2 className="ats-doc__sec-title">Projects</h2>
                      {projects.map((proj, idx) => (
                        <div key={idx} className="ats-doc__exp-item">
                          <div className="ats-doc__exp-header">
                            <div>
                              <strong className="ats-doc__company">{proj.name}</strong>
                              {proj.role && <span className="ats-doc__role"> — {proj.role}</span>}
                            </div>
                            {proj.link && <span className="ats-doc__dates">{proj.link}</span>}
                          </div>
                          {Array.isArray(proj.bullets) && proj.bullets.length > 0 && (
                            <ul className="ats-doc__bullets">
                              {proj.bullets.map((b, bi) => (
                                <li key={bi} className={showDiffHighlights && rightMode === "diff" ? "ats-diff-bullet" : ""}>
                                  {showDiffHighlights && rightMode === "diff"
                                    ? highlightBulletContent(b)
                                    : b}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {certifications.length > 0 && (
                    <div className="ats-doc__section">
                      <h2 className="ats-doc__sec-title">Certifications</h2>
                      {certifications.map((cert, idx) => (
                        <div key={idx} className="ats-doc__edu-item">
                          <div className="ats-doc__exp-header">
                            <div>
                              <strong className="ats-doc__company">{cert.name}</strong>
                              {cert.issuer && <span className="ats-doc__role"> — {cert.issuer}</span>}
                            </div>
                            {cert.date && <span className="ats-doc__dates">{cert.date}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtsBeforeAfterPreview;
