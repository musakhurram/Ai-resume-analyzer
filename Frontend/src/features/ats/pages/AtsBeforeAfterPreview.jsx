import { useState } from "react";
import "./AtsBeforeAfterPreview.scss";

const SECTION_OPTIONS = [
  { value: "all", label: "All Sections (Full Rewrite)" },
  { value: "summary", label: "Summary Only" },
  { value: "experience", label: "Experience Only" },
  { value: "skills", label: "Skills Only" },
  { value: "education", label: "Education Only" },
];

const ZOOM_STEPS = [50, 75, 90, 100, 110, 125, 150, 175, 200];

/* ---------- icons (all fixed 1.5 stroke, currentColor, no absolute-position tricks) ---------- */
const IconTarget = () => (
  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="8" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);
const IconSparkle = () => (
  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
    <path d="M7.6 1.3c.35 1.98 1.02 3.36 2.02 4.13.98.77 2.34 1.16 4.08 1.17-1.98.35-3.36 1.02-4.13 2.02-.77.98-1.16 2.34-1.17 4.08-.35-1.98-1.02-3.36-2.02-4.13-.98-.77-2.34-1.16-4.08-1.17 1.98-.35 3.36-1.02 4.13-2.02.77-.98 1.16-2.34 1.17-4.08z" fill="currentColor" />
  </svg>
);
const IconPdf = () => (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true">
    <path d="M6.5 2.75h7.4L18.5 7.35V20.2a1.05 1.05 0 0 1-1.05 1.05H6.5A1.05 1.05 0 0 1 5.45 20.2V3.8A1.05 1.05 0 0 1 6.5 2.75z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M13.9 2.75V6.6a.75.75 0 0 0 .75.75h3.85" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 16 16" fill="none" width="15" height="15" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5.2 8.2l1.9 1.9 3.7-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconEye = () => (
  <svg viewBox="0 0 16 16" fill="none" width="15" height="15" aria-hidden="true">
    <path d="M1.2 8S3.6 3.2 8 3.2 14.8 8 14.8 8 12.4 12.8 8 12.8 1.2 8 1.2 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="8" cy="8" r="2.1" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 16 16" fill="none" width="15" height="15" aria-hidden="true">
    <path d="M8 1.6l5.4 2v3.9c0 3.4-2.3 5.9-5.4 6.9-3.1-1-5.4-3.5-5.4-6.9V3.6L8 1.6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M5.3 8.1l1.9 1.9 3.5-3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconZoomOut = () => (
  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5 7h4M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const IconZoomIn = () => (
  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M7 5v4M5 7h4M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const IconExpand = () => (
  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
    <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------- resume document renderer ---------- */
const ResumeDoc = ({ resume }) => {
  if (!resume) return null;
  const { contact = {}, summary, skills = [], experience = [], education = [] } = resume;
  return (
    <div className="ats-cmp-doc">
      <div className="ats-cmp-doc__header">
        <p className="ats-cmp-doc__name">{contact.fullName || "Your Name"}</p>
        <div className="ats-cmp-doc__contact-row">
          {[contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean).map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </div>

      {summary && (
        <div className="ats-cmp-doc__section">
          <p className="ats-cmp-doc__sec-title">Summary</p>
          <p className="ats-cmp-doc__summary-text">{summary}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div className="ats-cmp-doc__section">
          <p className="ats-cmp-doc__sec-title">Skills</p>
          {skills.map((row, i) => (
            <p className="ats-cmp-doc__skill-row" key={i}>
              {row.category && <span className="ats-cmp-doc__skill-cat">{row.category}: </span>}
              <span className="ats-cmp-doc__skill-items">{Array.isArray(row.items) ? row.items.join(", ") : row.items}</span>
            </p>
          ))}
        </div>
      )}

      {experience.length > 0 && (
        <div className="ats-cmp-doc__section">
          <p className="ats-cmp-doc__sec-title">Experience</p>
          {experience.map((job, i) => (
            <div className="ats-cmp-doc__exp-item" key={i}>
              <div className="ats-cmp-doc__exp-header">
                <span><span className="ats-cmp-doc__company">{job.company}</span>{job.role && <> — <span className="ats-cmp-doc__role">{job.role}</span></>}</span>
                <span className="ats-cmp-doc__dates">{job.dates}</span>
              </div>
              {job.location && <p className="ats-cmp-doc__loc">{job.location}</p>}
              {Array.isArray(job.bullets) && job.bullets.length > 0 && (
                <ul className="ats-cmp-doc__bullets">
                  {job.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="ats-cmp-doc__section">
          <p className="ats-cmp-doc__sec-title">Education</p>
          {education.map((edu, i) => (
            <div className="ats-cmp-doc__exp-item" key={i}>
              <div className="ats-cmp-doc__exp-header">
                <span className="ats-cmp-doc__company">{edu.school}</span>
                <span className="ats-cmp-doc__dates">{edu.dates}</span>
              </div>
              {edu.degree && <p className="ats-cmp-doc__loc">{edu.degree}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ZoomControls = ({ zoom, onZoomOut, onZoomIn, onZoomSelect, onFullscreen }) => (
  <div className="ats-cmp-zoom">
    <button type="button" className="ats-cmp-zoom__btn" onClick={onZoomOut} aria-label="Zoom out"><IconZoomOut /></button>
    <button type="button" className="ats-cmp-zoom__btn" onClick={onZoomIn} aria-label="Zoom in"><IconZoomIn /></button>
    <select className="ats-cmp-zoom__select" value={zoom} onChange={(e) => onZoomSelect(Number(e.target.value))}>
      {ZOOM_STEPS.map((z) => <option key={z} value={z}>{z}%</option>)}
    </select>
    <button type="button" className="ats-cmp-zoom__btn" onClick={onFullscreen} aria-label="Fullscreen"><IconExpand /></button>
  </div>
);

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
  const [sections, setSections] = useState("all");
  const [customNotes, setCustomNotes] = useState("");
  const [zoomOriginal, setZoomOriginal] = useState(100);
  const [zoomRevised, setZoomRevised] = useState(100);
  const [fullscreenPane, setFullscreenPane] = useState(null);

  const handleGenerate = () => onRevise?.({ sections, customNotes });

  const step = (setter, current, dir) => {
    const idx = ZOOM_STEPS.indexOf(current);
    const base = idx === -1 ? 3 : idx;
    const next = dir === "in" ? Math.min(ZOOM_STEPS.length - 1, base + 1) : Math.max(0, base - 1);
    setter(ZOOM_STEPS[next]);
  };

  const toggleFullscreen = (pane) => setFullscreenPane((prev) => (prev === pane ? null : pane));

  return (
    <div className="ats-cmp">
      {/* --- toolbar --- */}
      <div className="ats-cmp-toolbar">
        <div className="ats-cmp-toolbar__field ats-cmp-toolbar__field--scope">
          <label className="ats-cmp-toolbar__label">Scope</label>
          <div className="ats-cmp-select">
            <IconTarget />
            <select value={sections} onChange={(e) => setSections(e.target.value)}>
              {SECTION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <span className="ats-cmp-chevron" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" width="12" height="12"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </div>
        </div>

        <div className="ats-cmp-toolbar__field ats-cmp-toolbar__field--notes">
          <label className="ats-cmp-toolbar__label">Focus</label>
          <div className="ats-cmp-input">
            <IconSparkle />
            <input
              type="text"
              placeholder="Optional rewrite focus (e.g. emphasize cloud, leadership…)"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="ats-cmp-toolbar__field ats-cmp-toolbar__field--action">
          <button type="button" className="ats-cmp-generate-btn" onClick={handleGenerate} disabled={loading}>
            {loading ? <span className="ats-cmp-spinner" /> : <IconSparkle />}
            <span>{loading ? "Generating…" : "Generate Revision"}</span>
          </button>
        </div>
      </div>

      {error && <p className="ats-cmp-error">{error}</p>}

      {/* --- compact hero --- */}
      <div className="ats-cmp-hero">
        <span className="ats-cmp-hero__icon"><IconPdf /></span>
        <div className="ats-cmp-hero__text">
          <h3>PDF-to-PDF comparison</h3>
          <p>See additions and replacements highlighted right where they happen in your resume.</p>
        </div>
        <div className="ats-cmp-hero__chips">
          <span className="ats-cmp-chip"><IconCheck /> Exact changes</span>
          <span className="ats-cmp-chip"><IconEye /> Side-by-side</span>
          <span className="ats-cmp-chip"><IconShield /> ATS-friendly</span>
        </div>
      </div>

      {/* --- panes --- */}
      <div className="ats-cmp-panes">
        <div className={`ats-cmp-pane ${fullscreenPane === "original" ? "is-fullscreen" : ""}`}>
          <div className="ats-cmp-pane__head">
            <span className="ats-cmp-pane__title ats-cmp-pane__title--original"><IconPdf /> Original Resume</span>
            <ZoomControls
              zoom={zoomOriginal}
              onZoomOut={() => step(setZoomOriginal, zoomOriginal, "out")}
              onZoomIn={() => step(setZoomOriginal, zoomOriginal, "in")}
              onZoomSelect={setZoomOriginal}
              onFullscreen={() => toggleFullscreen("original")}
            />
          </div>
          <div className="ats-cmp-pane__body">
            {originalPdfUrl ? (
              <div className="ats-cmp-iframe-wrap">
                <iframe title="Original resume PDF" src={originalPdfUrl} />
              </div>
            ) : originalText ? (
              <div className="ats-cmp-zoom-stage" style={{ transform: `scale(${zoomOriginal / 100})` }}>
                <pre className="ats-cmp-raw">{originalText}</pre>
              </div>
            ) : (
              <div className="ats-cmp-empty">No original resume available for preview.</div>
            )}
          </div>
        </div>

        <div className={`ats-cmp-pane ${fullscreenPane === "revised" ? "is-fullscreen" : ""}`}>
          <div className="ats-cmp-pane__head">
            <span className="ats-cmp-pane__title ats-cmp-pane__title--revised"><IconPdf /> AI Revised Resume</span>
            <ZoomControls
              zoom={zoomRevised}
              onZoomOut={() => step(setZoomRevised, zoomRevised, "out")}
              onZoomIn={() => step(setZoomRevised, zoomRevised, "in")}
              onZoomSelect={setZoomRevised}
              onFullscreen={() => toggleFullscreen("revised")}
            />
          </div>
          <div className="ats-cmp-pane__body ats-cmp-pane__body--paper">
            {revisedResume ? (
              <div className="ats-cmp-zoom-stage" style={{ transform: `scale(${zoomRevised / 100})` }}>
                <ResumeDoc resume={revisedResume} />
              </div>
            ) : loading ? (
              <div className="ats-cmp-empty"><span className="ats-cmp-spinner ats-cmp-spinner--lg" />Generating your AI revision…</div>
            ) : (
              <div className="ats-cmp-empty">Set a scope above and generate a revision to preview it here.</div>
            )}
          </div>
        </div>
      </div>

      {revisedResume && (
        <div className="ats-cmp-footer">
          <button
            type="button"
            className="ats-cmp-download-btn"
            disabled={downloading}
            onClick={() => onDownload?.(reportId, revisedResume?.contact?.fullName)}
          >
            {downloading ? "Preparing…" : "Download ATS PDF"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AtsBeforeAfterPreview;