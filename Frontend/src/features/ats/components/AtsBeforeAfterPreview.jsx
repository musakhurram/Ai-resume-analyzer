import { useEffect, useState } from "react";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import AtsPdfDiffViewer from "./AtsPdfDiffViewer";
import "./AtsBeforeAfterPreview.scss";

const SECTIONS_AVAILABLE = [
  { id: "all", label: "All Sections (Full Rewrite)" },
  { id: "summary", label: "Professional Summary" },
  { id: "experience", label: "Work Experience & Action Bullets" },
  { id: "skills", label: "Skills Taxonomy & Categories" },
  { id: "education", label: "Education & Details" },
];

const SwapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 8h15m0 0-4-4m4 4-4 4M20 16H5m0 0 4 4m-4-4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PdfIcon = ({ accent = false }) => (
  <svg viewBox="0 0 28 32" fill="none" aria-hidden="true" className={accent ? "is-accent" : ""}>
    <path d="M6 1.5h11l5.5 5.5v23.5H6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M17 1.5V7h5.5M9 20h10M9 24h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <text x="8.2" y="17" fill="currentColor" fontSize="5.2" fontWeight="800">PDF</text>
  </svg>
);

const FeatureIcon = ({ type }) => {
  if (type === "check") {
    return <svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="2" /><path d="m8.5 14 3.5 3.5 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (type === "eye") {
    return <svg viewBox="0 0 32 28" fill="none" aria-hidden="true"><path d="M2.5 14s4.4-8 13.5-8 13.5 8 13.5 8-4.4 8-13.5 8S2.5 14 2.5 14Z" stroke="currentColor" strokeWidth="2" /><circle cx="16" cy="14" r="4" stroke="currentColor" strokeWidth="2" /></svg>;
  }
  return <svg viewBox="0 0 28 30" fill="none" aria-hidden="true"><path d="m14 2 10 4v7c0 6.7-4.2 11.5-10 14-5.8-2.5-10-7.3-10-14V6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="m9 14 3.2 3.2L19 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};

const HeroComparisonVisual = () => (
  <div className="ats-studio-hero-visual" aria-hidden="true">
    <div className="ats-hero-dots ats-hero-dots--left" />
    <div className="ats-hero-page ats-hero-page--original">
      <span className="ats-hero-line ats-hero-line--short" /><span className="ats-hero-line" /><span className="ats-hero-line" /><span className="ats-hero-line ats-hero-line--medium" /><span className="ats-hero-line" /><span className="ats-hero-line ats-hero-line--short" /><span className="ats-hero-line ats-hero-line--medium" /><span className="ats-hero-line ats-hero-line--short" />
    </div>
    <div className="ats-hero-swap"><SwapIcon /></div>
    <div className="ats-hero-page ats-hero-page--revised">
      <span className="ats-hero-line ats-hero-line--short" /><span className="ats-hero-line" /><span className="ats-hero-line" /><span className="ats-hero-line ats-hero-line--accent" /><span className="ats-hero-line ats-hero-line--medium" /><span className="ats-hero-line ats-hero-line--accent" /><span className="ats-hero-line ats-hero-line--short ats-hero-line--accent" /><span className="ats-hero-line ats-hero-line--medium" />
    </div>
    <div className="ats-hero-dots ats-hero-dots--right" />
  </div>
);

const EmptyPane = ({ revised = false }) => (
  <div className={`ats-empty-pane ${revised ? "ats-empty-pane--revised" : ""}`} aria-hidden="true">
    <div className="ats-empty-pane__bar ats-empty-pane__bar--wide" />
    <div className="ats-empty-pane__bar" /><div className="ats-empty-pane__bar" /><div className="ats-empty-pane__bar ats-empty-pane__bar--medium" />
    <div className="ats-empty-pane__bar" /><div className="ats-empty-pane__bar ats-empty-pane__bar--short" />
  </div>
);

const AtsBeforeAfterPreview = ({ reportId, originalText, originalPdfUrl, revisedResume, loading, error, onRevise, onDownload, downloading }) => {
  const [selectedSection, setSelectedSection] = useState("all");
  const [customNotes, setCustomNotes] = useState("");
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (revisedResume) setShowIntro(false);
  }, [revisedResume]);

  const handleRunRevise = () => onRevise({ sections: selectedSection, customNotes });
  const candidateName = revisedResume?.contact?.fullName || "ATS-Resume";

  return (
    <div className="ats-preview-modal glass-panel">
      <section className="ats-preview-toolbar" aria-label="AI revision controls">
        <div className="ats-preview-toolbar__label-row">
          <span className="ats-toolbar-label">Scope</span>
          <span className="ats-toolbar-info" title="Choose which resume sections the AI should improve">ⓘ</span>
        </div>
        <div className="ats-preview-toolbar__row">
          <div className="ats-preview-toolbar__section-picker">
            <label htmlFor="sectionSelect" className="sr-only">Rewrite scope</label>
            <div className="ats-select-wrap">
              <span className="ats-control-icon ats-control-icon--target" aria-hidden="true">⌾</span>
              <select id="sectionSelect" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="ats-toolbar-select" disabled={loading}>
                {SECTIONS_AVAILABLE.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
              </select>
              <span className="ats-select-chevron" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"><path d="m4.5 6.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            </div>
          </div>
          <div className="ats-preview-toolbar__custom-notes">
            <label htmlFor="rewriteFocus" className="sr-only">Optional rewrite focus</label>
            <div className="ats-input-wrap">
              <span className="ats-control-icon ats-control-icon--sparkle" aria-hidden="true">✣</span>
              <input id="rewriteFocus" type="text" placeholder="Optional rewrite focus (e.g. emphasize cloud, leadership,...)" value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} className="ats-toolbar-input" disabled={loading} />
            </div>
          </div>
          <Button variant="primary" size="sm" loading={loading} onClick={handleRunRevise} className="ats-toolbar-btn">
            <span className="ats-generate-icon" aria-hidden="true">✣</span>
            {revisedResume ? "Re-generate" : "Generate Revision"}
          </Button>
        </div>
      </section>

      <section className="ats-preview-hero">
        <div className="ats-preview-hero__copy">
          <div className="glow-pill"><span className="glow-pill__dot" /><span>AI REVISION STUDIO</span></div>
          <h2 className="ats-preview-modal__title">PDF-to-PDF comparison</h2>
          <p className="ats-preview-modal__desc">Generate an AI revision to see additions and replacements highlighted at their actual locations inside your resume.</p>
        </div>
        <HeroComparisonVisual />
      </section>

      {error && <Callout tone="error" title="Revision Issue">{error}</Callout>}

      {showIntro && !revisedResume && !loading && (
        <>
          <section className="ats-preview-benefits">
            <div className="ats-preview-benefits__intro">
              <span className="ats-benefits-arrow"><SwapIcon /></span>
              <h3>See exactly what changed</h3>
              <p>Compare your original resume with the AI revision side by side. Additions and replacements stay highlighted in context so you can review every improvement before downloading.</p>
            </div>
            <div className="ats-preview-benefit">
              <FeatureIcon type="check" />
              <div><strong>Exact changes</strong><small>Additions &amp; replacements<br />shown in context</small></div>
            </div>
            <div className="ats-preview-benefit">
              <FeatureIcon type="eye" />
              <div><strong>Side-by-side view</strong><small>Original vs AI revision<br />in one place</small></div>
            </div>
            <div className="ats-preview-benefit">
              <FeatureIcon type="shield" />
              <div><strong>ATS-friendly output</strong><small>Optimized content<br />that gets noticed</small></div>
            </div>
          </section>

          <section className="ats-preview-placeholder-panes" aria-label="Resume comparison preview">
            <div className="ats-placeholder-pane">
              <div className="ats-placeholder-pane__head">
                <div className="ats-placeholder-pane__title ats-placeholder-pane__title--original"><PdfIcon /> <span>Original Resume</span></div>
                <div className="ats-placeholder-pane__tools"><button type="button" aria-label="Zoom out">−</button><button type="button" aria-label="Zoom in">+</button><span>100%⌄</span><button type="button" aria-label="Fullscreen">⛶</button></div>
              </div>
              <EmptyPane />
            </div>
            <div className="ats-placeholder-pane">
              <div className="ats-placeholder-pane__head">
                <div className="ats-placeholder-pane__title ats-placeholder-pane__title--revised"><PdfIcon accent /> <span>AI Revised Resume</span></div>
                <div className="ats-placeholder-pane__tools"><button type="button" aria-label="Zoom out">−</button><button type="button" aria-label="Zoom in">+</button><span>100%⌄</span><button type="button" aria-label="Fullscreen">⛶</button></div>
              </div>
              <EmptyPane revised />
            </div>
          </section>

          <section className="ats-preview-highlight-note">
            <div className="ats-preview-highlight-note__icon">✣</div>
            <div><strong>Highlights will appear here</strong><p>Once you generate the revision, you'll see additions in green, removals in red, and edits in yellow.</p></div>
            <div className="ats-preview-highlight-note__sparkles" aria-hidden="true">✦<br />＋</div>
          </section>
        </>
      )}

      {loading && (
        <div className="ats-preview-empty ats-preview-empty--loading">
          <div className="ats-spinner" />
          <h3>Generating your revised resume</h3>
          <p>Once the revision is ready, both PDF pages will be aligned and the changed text will be highlighted automatically.</p>
        </div>
      )}

      {revisedResume && !loading && (
        <AtsPdfDiffViewer
          reportId={reportId}
          originalPdfUrl={originalPdfUrl}
          originalText={originalText}
          revisedResume={revisedResume}
          onDownload={onDownload}
          downloading={downloading}
        />
      )}
    </div>
  );
};

export default AtsBeforeAfterPreview;
