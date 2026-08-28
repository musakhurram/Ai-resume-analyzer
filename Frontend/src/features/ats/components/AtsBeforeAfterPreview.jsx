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
      <div className="ats-preview-toolbar">
        <div className="ats-preview-toolbar__label-row">
          <span className="ats-toolbar-label">Rewrite controls</span>
          <span className="ats-toolbar-hint">Choose what the AI should improve</span>
        </div>
        <div className="ats-preview-toolbar__row">
          <div className="ats-preview-toolbar__section-picker">
            <label htmlFor="sectionSelect" className="ats-toolbar-label">Scope</label>
            <select id="sectionSelect" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="ats-toolbar-select" disabled={loading}>
              {SECTIONS_AVAILABLE.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
            </select>
          </div>
          <div className="ats-preview-toolbar__custom-notes">
            <label htmlFor="rewriteFocus" className="ats-toolbar-label">Rewrite focus <span>Optional</span></label>
            <input id="rewriteFocus" type="text" placeholder="e.g. emphasize cloud, leadership, measurable impact..." value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} className="ats-toolbar-input" disabled={loading} />
          </div>
          <Button variant="primary" size="sm" loading={loading} onClick={handleRunRevise} className="ats-toolbar-btn">
            {revisedResume ? "Re-generate" : "Generate Revision"}
          </Button>
        </div>
      </div>

      <div className="ats-preview-modal__header">
        <div className="ats-preview-modal__titles">
          <div className="glow-pill"><span className="glow-pill__dot" /><span>AI REVISION STUDIO</span></div>
          <h2 className="ats-preview-modal__title">PDF-to-PDF comparison</h2>
          <p className="ats-preview-modal__desc">Generate an AI revision to see additions and replacements highlighted at their actual locations inside your resume.</p>
        </div>
        {revisedResume && <Button variant="secondary" size="sm" loading={downloading} onClick={() => onDownload(reportId, candidateName)}>Download ATS PDF</Button>}
      </div>

      {error && <Callout tone="error" title="Revision Issue">{error}</Callout>}

      {showIntro && !revisedResume && !loading && (
        <div className="ats-preview-empty">
          <div className="ats-preview-empty__visual" aria-hidden="true">
            <div className="ats-preview-empty__page ats-preview-empty__page--original"><span /><span /><span /><span /><span /></div>
            <div className="ats-preview-empty__swap">↔</div>
            <div className="ats-preview-empty__page ats-preview-empty__page--revised"><span /><span /><span /><span /><span /></div>
          </div>
          <div className="ats-preview-empty__copy">
            <h3>See exactly what changed</h3>
            <p>Compare your original resume with the AI revision side by side. Additions and replacements stay highlighted in context so you can review every improvement before downloading.</p>
          </div>
          <div className="ats-preview-empty__features">
            <div className="ats-preview-empty__feature"><span>✓</span><div><strong>Exact changes</strong><small>Additions & replacements in context</small></div></div>
            <div className="ats-preview-empty__feature"><span>◉</span><div><strong>Side-by-side view</strong><small>Original vs AI revision</small></div></div>
            <div className="ats-preview-empty__feature"><span>◇</span><div><strong>ATS-friendly output</strong><small>Optimized content structure</small></div></div>
          </div>
        </div>
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
