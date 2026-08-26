import { useState } from "react";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";

const SECTIONS_AVAILABLE = [
  { id: "all", label: "All Sections (Recommended)" },
  { id: "summary", label: "Professional Summary" },
  { id: "experience", label: "Work Experience & Bullets" },
  { id: "skills", label: "Skills Taxonomy & Categories" },
  { id: "education", label: "Education & Details" },
];

const AtsBeforeAfterPreview = ({
  reportId,
  originalText,
  revisedResume,
  loading,
  error,
  onRevise,
  onDownload,
  downloading,
}) => {
  const [selectedSection, setSelectedSection] = useState("all");
  const [customNotes, setCustomNotes] = useState("");
  const [viewMode, setViewMode] = useState("split"); // "split" | "revised" | "original"
  const [copied, setCopied] = useState(false);

  const handleRunRevise = () => {
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
          <h2 className="ats-preview-modal__title">ATS-Optimized Resume Preview</h2>
          <p className="ats-preview-modal__desc">
            Fact-preserving AI rewrite. Weak verbs and passive tasks are transformed into strong,
            quantified statements formatted in a strict single-column ATS architecture.
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
              placeholder="Optional rewrite focus (e.g. emphasize metrics, cloud)..."
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

          {/* View mode toggle */}
          <div className="ats-view-mode-tabs">
            <button
              type="button"
              className={`ats-view-btn ${viewMode === "split" ? "is-active" : ""}`}
              onClick={() => setViewMode("split")}
            >
              Split View
            </button>
            <button
              type="button"
              className={`ats-view-btn ${viewMode === "revised" ? "is-active" : ""}`}
              onClick={() => setViewMode("revised")}
            >
              ATS Resume
            </button>
            <button
              type="button"
              className={`ats-view-btn ${viewMode === "original" ? "is-active" : ""}`}
              onClick={() => setViewMode("original")}
            >
              Raw Input
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className={`ats-preview-panes ats-preview-panes--${viewMode}`}>
        {/* Left / Original Pane */}
        {(viewMode === "split" || viewMode === "original") && (
          <div className="ats-pane ats-pane--original">
            <div className="ats-pane__head">
              <span className="ats-pane__tag">BEFORE</span>
              <h3 className="ats-pane__title">Original Uploaded Text</h3>
            </div>
            <div className="ats-pane__body ats-pane__body--raw">
              <pre>{originalText || "No original text available."}</pre>
            </div>
          </div>
        )}

        {/* Right / Revised ATS Resume View */}
        {(viewMode === "split" || viewMode === "revised") && (
          <div className="ats-pane ats-pane--revised">
            <div className="ats-pane__head">
              <div className="ats-pane__head-left">
                <span className="ats-pane__tag ats-pane__tag--accent">AFTER (ATS READY)</span>
                <h3 className="ats-pane__title">AI-Optimized Single-Column Resume</h3>
              </div>
              <button
                type="button"
                className="ats-copy-btn"
                onClick={handleCopyRevised}
                disabled={!revisedResume}
              >
                {copied ? "Copied JSON" : "Copy JSON"}
              </button>
            </div>

            <div className="ats-pane__body ats-pane__body--document">
              {loading ? (
                <div className="ats-pane-loading">
                  <div className="ats-spinner" />
                  <p>Synthesizing ATS-optimized resume with strict factual preservation…</p>
                  <span>Checking Google X-Y-Z achievement formulas & action verbs</span>
                </div>
              ) : !revisedResume ? (
                <div className="ats-pane-prompt">
                  <p>Click "Generate AI Revision" above to transform your resume into an ATS-optimized structure.</p>
                </div>
              ) : (
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
                    <div className="ats-doc__section">
                      <h2 className="ats-doc__sec-title">Professional Summary</h2>
                      <p className="ats-doc__summary-text">{summary}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="ats-doc__section">
                      <h2 className="ats-doc__sec-title">Technical Skills</h2>
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
                      <h2 className="ats-doc__sec-title">Professional Experience</h2>
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
                                <li key={bi}>{b}</li>
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
                                <li key={bi}>{b}</li>
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AtsBeforeAfterPreview;
