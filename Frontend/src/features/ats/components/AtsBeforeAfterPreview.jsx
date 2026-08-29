import { useState } from "react";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import AtsPdfDiffViewer from "./AtsPdfDiffViewer";
import "./AtsBeforeAfterPreview.scss";
import "./AtsBeforeAfterPreviewFixes.scss";

const SECTIONS_AVAILABLE = [
  { id: "all", label: "All Sections (Full Rewrite)" },
  { id: "summary", label: "Professional Summary" },
  { id: "experience", label: "Work Experience & Action Bullets" },
  { id: "skills", label: "Skills Taxonomy & Categories" },
  { id: "education", label: "Education & Details" },
];

const Icon = ({ children, size = 20, className = "" }) => (
  <span className={`ats-inline-icon ${className}`} style={{ width: size, height: size, flex: `0 0 ${size}px` }}>
    {children}
  </span>
);

const SparkleIcon = ({ size = 20 }) => (
  <Icon size={size}>
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M7.5 1.25L8.75 4.9C8.95 5.5 9.4 5.95 10 6.15L13.65 7.4L10 8.65C9.4 8.85 8.95 9.3 8.75 9.9L7.5 13.55L6.25 9.9C6.05 9.3 5.6 8.85 5 8.65L1.35 7.4L5 6.15C5.6 5.95 6.05 5.5 6.25 4.9L7.5 1.25Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M12.5 1.25L13.05 2.55C13.15 2.8 13.35 3 13.6 3.1L14.9 3.65L13.6 4.2C13.35 4.3 13.15 4.5 13.05 4.75L12.5 6.05L11.95 4.75C11.85 4.5 11.65 4.3 11.4 4.2L10.1 3.65L11.4 3.1C11.65 3 11.85 2.8 11.95 2.55L12.5 1.25Z"
        fill="currentColor"
      />
    </svg>
  </Icon>
);

const SectionsIcon = ({ size = 17 }) => (
  <Icon size={size} className="ats-sections-icon">
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m10 3 7 3.5-7 3.5-7-3.5L10 3Z" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round" />
      <path d="m4.5 9 5.5 2.75L15.5 9M4.5 12.5 10 15.25l5.5-2.75" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  </Icon>
);

const SwapIcon = () => (
  <Icon size={22}>
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8h15m0 0-4-4m4 4-4 4M20 16H5m0 0 4 4m-4-4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Icon>
);

const HeroComparisonVisual = () => (
  <div className="ats-studio-hero-visual" aria-hidden="true">
    <div className="ats-hero-dots ats-hero-dots--left" />
    <div className="ats-hero-page ats-hero-page--original">
      <span className="ats-hero-line ats-hero-line--short" /><span className="ats-hero-line" /><span className="ats-hero-line" />
      <span className="ats-hero-line ats-hero-line--medium" /><span className="ats-hero-line" /><span className="ats-hero-line ats-hero-line--short" />
    </div>
    <div className="ats-hero-swap"><SwapIcon /></div>
    <div className="ats-hero-page ats-hero-page--revised">
      <span className="ats-hero-line ats-hero-line--short" /><span className="ats-hero-line" /><span className="ats-hero-line ats-hero-line--accent" />
      <span className="ats-hero-line ats-hero-line--medium" /><span className="ats-hero-line ats-hero-line--accent" /><span className="ats-hero-line ats-hero-line--short ats-hero-line--accent" />
    </div>
    <div className="ats-hero-dots ats-hero-dots--right" />
  </div>
);

const AtsBeforeAfterPreview = ({ reportId, originalText, originalPdfUrl, revisedResume, loading, error, onRevise, onDownload, downloading }) => {
  const [selectedSection, setSelectedSection] = useState("all");
  const [customNotes, setCustomNotes] = useState("");
  const hasRevision = Boolean(revisedResume);
  const handleRunRevise = () => onRevise({ sections: selectedSection, customNotes });

  return <div className="ats-preview-modal glass-panel">
    <section className="ats-preview-toolbar" aria-label="AI revision controls">
      <div className="ats-preview-toolbar__row">
        <div className="ats-preview-toolbar__section-picker">
          <label htmlFor="sectionSelect" className="sr-only">Rewrite scope</label>
          <div className="ats-select-wrap">
            <span className="ats-control-icon ats-control-icon--sections" aria-hidden="true"><SectionsIcon /></span>
            <select id="sectionSelect" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="ats-toolbar-select" disabled={loading}>
              {SECTIONS_AVAILABLE.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <span className="ats-select-chevron" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"><path d="m4.5 6.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          </div>
        </div>
        <div className="ats-preview-toolbar__custom-notes">
          <label htmlFor="rewriteFocus" className="sr-only">Optional rewrite focus</label>
          <div className="ats-input-wrap">
            <span className="ats-control-icon ats-control-icon--sparkle"><SparkleIcon /></span>
            <input id="rewriteFocus" type="text" placeholder="Optional rewrite focus (e.g. emphasize cloud, leadership,...)" value={customNotes} onChange={e => setCustomNotes(e.target.value)} className="ats-toolbar-input" disabled={loading} />
          </div>
        </div>
        <Button variant="primary" size="sm" loading={loading} onClick={handleRunRevise} className="ats-toolbar-btn">
          {hasRevision ? "Re-generate" : "Generate Revision"}
        </Button>
      </div>
    </section>

    {!hasRevision && !loading && <>
      <section className="ats-preview-hero">
        <div className="ats-preview-hero__copy">
          <div className="glow-pill"><span className="glow-pill__dot" /><span>AI REVISION STUDIO</span></div>
          <h2 className="ats-preview-modal__title">PDF-to-PDF comparison</h2>
          <p className="ats-preview-modal__desc">Generate an AI revision to see additions and replacements highlighted at their actual locations inside your resume.</p>
        </div>
        <HeroComparisonVisual />
      </section>
      {error && <Callout tone="error" title="Revision Issue">{error}</Callout>}
    </>}

    {loading && <div className="ats-preview-empty ats-preview-empty--loading"><div className="ats-spinner" /><h3>Generating your revised resume</h3><p>Once the revision is ready, both PDF pages will be aligned and the changed text highlighted automatically.</p></div>}
    {hasRevision && !loading && <>{error && <Callout tone="error" title="Revision Issue">{error}</Callout>}<AtsPdfDiffViewer reportId={reportId} originalPdfUrl={originalPdfUrl} originalText={originalText} revisedResume={revisedResume} onDownload={onDownload} downloading={downloading} /></>}
  </div>;
};

export default AtsBeforeAfterPreview;
