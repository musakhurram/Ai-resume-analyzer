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
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8z" fill="currentColor" />
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
          <span className="ats-generate-icon" aria-hidden="true"><SparkleIcon size={16} /></span>
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
