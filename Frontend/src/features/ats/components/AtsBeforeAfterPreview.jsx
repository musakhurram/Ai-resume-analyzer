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
  <span className={`ats-inline-icon ${className}`} style={{ width: size, height: size, flex: `0 0 ${size}px` }}>{children}</span>
);
const TargetIcon = () => <Icon><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></Icon>;
const SparkleIcon = ({ size = 20 }) => <Icon size={size}><svg viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" fill="currentColor"/></svg></Icon>;
const InfoIcon = () => <Icon size={16}><svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M9 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="5.5" r=".8" fill="currentColor"/></svg></Icon>;
const SwapIcon = () => <Icon size={22}><svg viewBox="0 0 24 24" fill="none"><path d="M4 8h15m0 0-4-4m4 4-4 4M20 16H5m0 0 4 4m-4-4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></Icon>;
const PdfIcon = ({ accent = false }) => <Icon size={24} className={accent ? "is-accent" : ""}><svg viewBox="0 0 28 32" fill="none"><path d="M6 1.5h11l5.5 5.5v23.5H6z" stroke="currentColor" strokeWidth="1.7"/><text x="8.2" y="17" fill="currentColor" fontSize="5.2" fontWeight="800">PDF</text></svg></Icon>;
const FeatureIcon = ({ type }) => <Icon size={28}>{type === "check" ? <svg viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="2"/><path d="m8.5 14 3.5 3.5 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> : type === "eye" ? <svg viewBox="0 0 32 28" fill="none"><path d="M2.5 14s4.4-8 13.5-8 13.5 8 13.5 8-4.4 8-13.5 8S2.5 14 2.5 14Z" stroke="currentColor" strokeWidth="2"/><circle cx="16" cy="14" r="4" stroke="currentColor" strokeWidth="2"/></svg> : <svg viewBox="0 0 28 30" fill="none"><path d="m14 2 10 4v7c0 6.7-4.2 11.5-10 14-5.8-2.5-10-7.3-10-14V6z" stroke="currentColor" strokeWidth="2"/><path d="m9 14 3.2 3.2L19 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}</Icon>;

const HeroComparisonVisual = () => <div className="ats-studio-hero-visual" aria-hidden="true"><div className="ats-hero-dots ats-hero-dots--left"/><div className="ats-hero-page ats-hero-page--original"><span className="ats-hero-line ats-hero-line--short"/><span className="ats-hero-line"/><span className="ats-hero-line"/><span className="ats-hero-line ats-hero-line--medium"/><span className="ats-hero-line"/><span className="ats-hero-line ats-hero-line--short"/></div><div className="ats-hero-swap"><SwapIcon/></div><div className="ats-hero-page ats-hero-page--revised"><span className="ats-hero-line ats-hero-line--short"/><span className="ats-hero-line"/><span className="ats-hero-line ats-hero-line--accent"/><span className="ats-hero-line ats-hero-line--medium"/><span className="ats-hero-line ats-hero-line--accent"/><span className="ats-hero-line ats-hero-line--short ats-hero-line--accent"/></div><div className="ats-hero-dots ats-hero-dots--right"/></div>;
const EmptyPane = ({ revised = false }) => <div className={`ats-empty-pane ${revised ? "ats-empty-pane--revised" : ""}`} aria-hidden="true"><div className="ats-empty-pane__bar ats-empty-pane__bar--wide"/><div className="ats-empty-pane__bar"/><div className="ats-empty-pane__bar"/><div className="ats-empty-pane__bar ats-empty-pane__bar--medium"/><div className="ats-empty-pane__bar"/></div>;

const AtsBeforeAfterPreview = ({ reportId, originalText, originalPdfUrl, revisedResume, loading, error, onRevise, onDownload, downloading }) => {
  const [selectedSection, setSelectedSection] = useState("all");
  const [customNotes, setCustomNotes] = useState("");
  const hasRevision = Boolean(revisedResume);
  const handleRunRevise = () => onRevise({ sections: selectedSection, customNotes });

  return <div className="ats-preview-modal glass-panel">
    <section className="ats-preview-toolbar" aria-label="AI revision controls">
      <div className="ats-preview-toolbar__label-row"><span className="ats-toolbar-label">Scope</span><span className="ats-toolbar-info" title="Choose which resume sections the AI should improve"><InfoIcon/></span></div>
      <div className="ats-preview-toolbar__row">
        <div className="ats-preview-toolbar__section-picker"><label htmlFor="sectionSelect" className="sr-only">Rewrite scope</label><div className="ats-select-wrap"><span className="ats-control-icon ats-control-icon--target"><TargetIcon/></span><select id="sectionSelect" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="ats-toolbar-select" disabled={loading}>{SECTIONS_AVAILABLE.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select><span className="ats-select-chevron" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"><path d="m4.5 6.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span></div></div>
        <div className="ats-preview-toolbar__custom-notes"><label htmlFor="rewriteFocus" className="sr-only">Optional rewrite focus</label><div className="ats-input-wrap"><span className="ats-control-icon ats-control-icon--sparkle"><SparkleIcon/></span><input id="rewriteFocus" type="text" placeholder="Optional rewrite focus (e.g. emphasize cloud, leadership,...)" value={customNotes} onChange={e => setCustomNotes(e.target.value)} className="ats-toolbar-input" disabled={loading}/></div></div>
        <Button variant="primary" size="sm" loading={loading} onClick={handleRunRevise} className="ats-toolbar-btn"><span className="ats-generate-icon" aria-hidden="true"><SparkleIcon size={18}/></span>{hasRevision ? "Re-generate" : "Generate Revision"}</Button>
      </div>
    </section>

    {!hasRevision && !loading && <>
      <section className="ats-preview-hero"><div className="ats-preview-hero__copy"><div className="glow-pill"><span className="glow-pill__dot"/><span>AI REVISION STUDIO</span></div><h2 className="ats-preview-modal__title">PDF-to-PDF comparison</h2><p className="ats-preview-modal__desc">Generate an AI revision to see additions and replacements highlighted at their actual locations inside your resume.</p></div><HeroComparisonVisual/></section>
      {error && <Callout tone="error" title="Revision Issue">{error}</Callout>}
    </>}

    {loading && <div className="ats-preview-empty ats-preview-empty--loading"><div className="ats-spinner"/><h3>Generating your revised resume</h3><p>Once the revision is ready, both PDF pages will be aligned and the changed text highlighted automatically.</p></div>}
    {hasRevision && !loading && <>{error && <Callout tone="error" title="Revision Issue">{error}</Callout>}<AtsPdfDiffViewer reportId={reportId} originalPdfUrl={originalPdfUrl} originalText={originalText} revisedResume={revisedResume} onDownload={onDownload} downloading={downloading}/></>}
  </div>;
};

export default AtsBeforeAfterPreview;
