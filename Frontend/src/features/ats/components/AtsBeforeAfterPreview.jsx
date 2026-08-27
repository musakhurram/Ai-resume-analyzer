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
      <div className="ats-preview-modal__header">
        <div className="ats-preview-modal__titles">
          <div className="glow-pill"><span className="glow-pill__dot" /><span>AI REVISION STUDIO</span></div>
          <h2 className="ats-preview-modal__title">See exactly what changed</h2>
          <p className="ats-preview-modal__desc">The comparison is rendered from the actual PDF pages. Added and replaced content is highlighted directly over its position in the document.</p>
        </div>
        {revisedResume && <Button variant="primary" size="md" loading={downloading} onClick={() => onDownload(reportId, candidateName)}>Download ATS PDF</Button>}
      </div>

      {error && <Callout tone="error" title="Revision Issue">{error}</Callout>}

      <div className="ats-preview-toolbar">
        <div className="ats-preview-toolbar__row">
          <div className="ats-preview-toolbar__section-picker">
            <label htmlFor="sectionSelect" className="ats-toolbar-label">Scope:</label>
            <select id="sectionSelect" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="ats-toolbar-select" disabled={loading}>
              {SECTIONS_AVAILABLE.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
            </select>
          </div>
          <div className="ats-preview-toolbar__custom-notes">
            <input type="text" placeholder="Optional rewrite focus (e.g. emphasize cloud, leadership)..." value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} className="ats-toolbar-input" disabled={loading} />
          </div>
          <Button variant="secondary" size="sm" loading={loading} onClick={handleRunRevise} className="ats-toolbar-btn">
            {revisedResume ? "Re-generate" : "Generate Revision"}
          </Button>
        </div>
      </div>

      {showIntro && !revisedResume && !loading && (
        <div className="ats-preview-empty">
          <div className="ats-preview-empty__icon">↔</div>
          <h3>PDF-to-PDF comparison</h3>
          <p>Generate an AI revision to see additions and replacements highlighted at their actual locations inside the resume.</p>
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
