import { useState, useEffect } from "react";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import { fetchAtsPdfBlobUrl } from "../services/ats.api";

const SECTIONS_AVAILABLE = [
  { id: "all", label: "All Sections (Full Rewrite)" },
  { id: "summary", label: "Professional Summary" },
  { id: "experience", label: "Work Experience & Action Bullets" },
  { id: "skills", label: "Skills Taxonomy & Categories" },
  { id: "education", label: "Education & Details" },
];

// Common strong action verbs to highlight in diff view
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
        <span className="ats-diff-verb" title="AI Action Verb Upgrade">
          {words[0]}{" "}
        </span>
      ) : (
        words[0] + " "
      )}
      {words.slice(1).map((w, i) => {
        // Highlight metrics ($100k, 45%, 99.9%, 10x, 200+)
        const isMetric = /[\$€£]?\d+(\.\d+)?%?[\+xX]?|\b\d+([kKmMbB])\b/.test(w);
        if (isMetric) {
          return (
            <span key={i} className="ats-diff-metric" title="Preserved Metric">
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
  const [leftMode, setLeftMode] = useState(originalPdfUrl ? "pdf" : "text"); // "pdf" | "text"
  const [rightMode, setRightMode] = useState("diff"); // "diff" | "pdf" | "clean"
  const [showDiffHighlights, setShowDiffHighlights] = useState(true);
  const [revisedPdfUrl, setRevisedPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync leftMode if originalPdfUrl changes
  useEffect(() => {
    if (originalPdfUrl && leftMode === "text") {
      setLeftMode("pdf");
    }
  }, [originalPdfUrl]);

  // Pre-fetch revised PDF blob url in background as soon as revision is available
  useEffect(() => {
    let active = true;
    if (reportId && revisedResume && !revisedPdfUrl && !loadingPdf) {
      setLoadingPdf(true);
      fetchAtsPdfBlobUrl(reportId)
        .then((url) => {
          if (active) {
            setRevisedPdfUrl(url);
          }
        })
        .catch((err) => {
          console.warn("PDF background preload note:", err.message);
        })
        .finally(() => {
          if (active) setLoadingPdf(false);
        });
    }
    return () => {
      active = false;
    };
  }, [reportId, revisedResume, revisedPdfUrl, loadingPdf]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (revisedPdfUrl) {
        window.URL.revokeObjectURL(revisedPdfUrl);
      }
    };
  }, [revisedPdfUrl]);

  const handleRunRevise = () => {
    // Reset revised PDF preview so it refreshes with new revision
    if (revisedPdfUrl) {
      window.URL.revokeObjectURL(revisedPdfUrl);
      setRevisedPdfUrl(null);
    }
    onRevise({
      sections: selectedSection,
      customNotes,
    });
  };

  const handleCopyRevised = () => {
    if (!revisedResume) return;
    const jsonStr = JSON.stringify(revisedResume, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      {/* Header bar */}
      <div className="ats-preview-modal__header">
        <div className="ats-preview-modal__titles">
          <div className="glow-pill">
            <span className="glow-pill__dot" />
            <span>AI REVISION STUDIO</span>
          </div>
          <h2 className="ats-preview-modal__title">Side-by-Side Comparison & AI Highlights</h2>
          <p className="ats-preview-modal__desc">
            Compare your original upload side-by-side with the AI-optimized version. Action verbs,
            quantified impact, and ATS taxonomy improvements are highlighted in real-time.
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
              <svg viewBox="0 0 16 16" fill="none" width="16" height="16" className="pdf-icon">
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

      {/* Revision Controls Toolbar */}
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

      {/* Diff Highlights Legend */}
      {rightMode === "diff" && showDiffHighlights && revisedResume && (
        <div className="ats-diff-legend">
          <span className="ats-diff-legend__title">AI Enhancements:</span>
          <div className="ats-diff-legend__items">
            <span className="ats-legend-chip ats-legend-chip--verb">
              <span className="ats-legend-dot ats-legend-dot--verb" />
              Power Action Verb
            </span>
            <span className="ats-legend-chip ats-legend-chip--metric">
              <span className="ats-legend-dot ats-legend-dot--metric" />
              Preserved Metric / Scale
            </span>
            <span className="ats-legend-chip ats-legend-chip--tax">
              <span className="ats-legend-dot ats-legend-dot--tax" />
              ATS Taxonomy & Keywords
            </span>
            <span className="ats-legend-chip ats-legend-chip--clean">
              <span className="ats-legend-dot ats-legend-dot--clean" />
              Zero Fabrication Guaranteed
            </span>
          </div>

          <label className="ats-diff-toggle">
            <input
              type="checkbox"
              checked={showDiffHighlights}
              onChange={(e) => setShowDiffHighlights(e.target.checked)}
            />
            <span>Show Highlights</span>
          </label>
        </div>
      )}

      {/* Main Content Side-by-Side Split Panes */}
      <div className="ats-preview-panes ats-preview-panes--split">
        {/* Left / Original Uploaded Pane */}
        <div className="ats-pane ats-pane--original">
          <div className="ats-pane__head">
            <div className="ats-pane__head-left">
              <span className="ats-pane__tag">BEFORE</span>
              <h3 className="ats-pane__title">Original Resume</h3>
            </div>

            {/* Switch between PDF iframe and Text view */}
            <div className="ats-pane-view-tabs">
              {originalPdfUrl && (
                <button
                  type="button"
                  className={`ats-pane-tab-btn ${leftMode === "pdf" ? "is-active" : ""}`}
                  onClick={() => setLeftMode("pdf")}
                >
                  📄 PDF
                </button>
              )}
              <button
                type="button"
                className={`ats-pane-tab-btn ${leftMode === "text" ? "is-active" : ""}`}
                onClick={() => setLeftMode("text")}
              >
                📝 Text
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

        {/* Right / AI-Revised Resume Pane */}
        <div className="ats-pane ats-pane--revised">
          <div className="ats-pane__head">
            <div className="ats-pane__head-left">
              <span className="ats-pane__tag ats-pane__tag--accent">AFTER (AI ATS OPTIMIZED)</span>
              <h3 className="ats-pane__title">Revised Output</h3>
            </div>

            <div className="ats-pane-head-actions">
              {/* Mode switch for right pane: Diff Document vs PDF Viewer vs Clean */}
              <div className="ats-pane-view-tabs">
                <button
                  type="button"
                  className={`ats-pane-tab-btn ${rightMode === "diff" ? "is-active" : ""}`}
                  onClick={() => setRightMode("diff")}
                  title="Interactive Document with AI Diff Highlights"
                >
                  ✨ Diff View
                </button>
                <button
                  type="button"
                  className={`ats-pane-tab-btn ${rightMode === "pdf" ? "is-active" : ""}`}
                  onClick={() => setRightMode("pdf")}
                  title="View Live Generated ATS PDF"
                >
                  📄 ATS PDF
                </button>
                <button
                  type="button"
                  className={`ats-pane-tab-btn ${rightMode === "clean" ? "is-active" : ""}`}
                  onClick={() => setRightMode("clean")}
                  title="Clean White Paper View"
                >
                  📄 Clean
                </button>
              </div>

              <button
                type="button"
                className="ats-copy-btn"
                onClick={handleCopyRevised}
                disabled={!revisedResume}
              >
                {copied ? "Copied" : "JSON"}
              </button>
            </div>
          </div>

          <div className="ats-pane__body ats-pane__body--revised-wrap">
            {loading ? (
              <div className="ats-pane-loading">
                <div className="ats-spinner" />
                <p>Synthesizing ATS-optimized resume with strict factual preservation…</p>
                <span>Upgrading action verbs & formatting into clean single-column architecture</span>
              </div>
            ) : !revisedResume ? (
              <div className="ats-pane-prompt">
                <p>Click "Generate Revision" above to rewrite your resume with ATS-optimized action bullets.</p>
              </div>
            ) : rightMode === "pdf" ? (
              <div className="ats-iframe-container">
                {loadingPdf ? (
                  <div className="ats-pane-loading">
                    <div className="ats-spinner" />
                    <p>Rendering clean single-column PDF with Puppeteer…</p>
                  </div>
                ) : revisedPdfUrl ? (
                  <iframe
                    src={revisedPdfUrl}
                    title="AI-Generated ATS Resume PDF"
                    className="ats-preview-iframe"
                  />
                ) : (
                  <div className="ats-pane-prompt">
                    <p>Failed to load PDF preview. Click "Download ATS PDF" above.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={`ats-pane__body--document ${showDiffHighlights && rightMode === "diff" ? "has-diff-mode" : ""}`}>
                <div className="ats-resume-doc">
                  {/* Contact header */}
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

                  {/* Summary */}
                  {summary && (
                    <div className={`ats-doc__section ${showDiffHighlights && rightMode === "diff" ? "ats-diff-section" : ""}`}>
                      <div className="ats-doc__sec-header">
                        <h2 className="ats-doc__sec-title">Professional Summary</h2>
                        {showDiffHighlights && rightMode === "diff" && (
                          <span className="ats-diff-chip ats-diff-chip--ai">ATS Tailored</span>
                        )}
                      </div>
                      <p className="ats-doc__summary-text">{summary}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className={`ats-doc__section ${showDiffHighlights && rightMode === "diff" ? "ats-diff-section" : ""}`}>
                      <div className="ats-doc__sec-header">
                        <h2 className="ats-doc__sec-title">Technical Skills</h2>
                        {showDiffHighlights && rightMode === "diff" && (
                          <span className="ats-diff-chip ats-diff-chip--tax">Taxonomy Grouped</span>
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

                  {/* Experience */}
                  {experience.length > 0 && (
                    <div className="ats-doc__section">
                      <div className="ats-doc__sec-header">
                        <h2 className="ats-doc__sec-title">Professional Experience</h2>
                        {showDiffHighlights && rightMode === "diff" && (
                          <span className="ats-diff-chip ats-diff-chip--verb">Action-Verb Led</span>
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

                  {/* Education */}
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

                  {/* Projects */}
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

                  {/* Certifications */}
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
