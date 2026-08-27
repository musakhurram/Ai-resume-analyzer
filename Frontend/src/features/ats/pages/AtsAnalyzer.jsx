import { useState, useRef } from "react";
import AtsUploadForm from "../components/AtsUploadForm";
import AtsScoreOverview from "../components/AtsScoreOverview";
import AtsIssuesList from "../components/AtsIssuesList";
import AtsSectionFeedback from "../components/AtsSectionFeedback";
import AtsTopSuggestions from "../components/AtsTopSuggestions";
import AtsStrengthsList from "../components/AtsStrengthsList";
import AtsBeforeAfterPreview from "../components/AtsBeforeAfterPreview";
import Callout from "../../../shared/components/Callout";
import Button from "../../../shared/components/Button";
import {
  analyzeAtsResume,
  reviseAtsResume,
  downloadAtsPdf,
} from "../services/ats.api";
import "./AtsAnalyzer.scss";

const CREDIT_LIMIT_MESSAGE = "You have no AI credits remaining. Purchase more credits to continue.";

const AtsAnalyzer = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [report, setReport] = useState(null);
  const [originalPdfUrl, setOriginalPdfUrl] = useState(null);

  const [activeTab, setActiveTab] = useState("audit");
  const [revising, setRevising] = useState(false);
  const [reviseError, setReviseError] = useState("");
  const [revisedResume, setRevisedResume] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const previewSectionRef = useRef(null);

  const handleAnalyze = async ({ resume, resumeText, fileName }) => {
    setAnalysisError("");
    setAnalyzing(true);
    try {
      if (resume instanceof File || resume instanceof Blob) {
        if (originalPdfUrl) window.URL.revokeObjectURL(originalPdfUrl);
        const objUrl = window.URL.createObjectURL(resume);
        setOriginalPdfUrl(objUrl);
      } else {
        setOriginalPdfUrl(null);
      }

      const data = await analyzeAtsResume({ resume, resumeText, fileName });
      setReport(data.atsReport);
      setRevisedResume(data.atsReport.revisedResume || null);
      setActiveTab("audit");
      window.dispatchEvent(new Event("billing:updated"));
    } catch (err) {
      setAnalysisError(
        err.response?.status === 402
          ? err.response?.data?.message || CREDIT_LIMIT_MESSAGE
          : err.response?.data?.message || err.message || "Failed to analyze resume for ATS. Please check the file and try again.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRevise = async ({ sections = "all", customNotes = "" }) => {
    if (!report?._id) return;
    setReviseError("");
    setRevising(true);
    try {
      const data = await reviseAtsResume({ id: report._id, sections, customNotes });
      setRevisedResume(data.revisedResume);
      setReport((prev) => ({ ...prev, revisedResume: data.revisedResume }));
      setActiveTab("studio");
      window.dispatchEvent(new Event("billing:updated"));
    } catch (err) {
      setReviseError(
        err.response?.status === 402
          ? err.response?.data?.message || CREDIT_LIMIT_MESSAGE
          : err.response?.data?.message || err.message || "Failed to revise resume with AI. Please try again.",
      );
    } finally {
      setRevising(false);
    }
  };

  const handleFixSection = (sectionKey) => {
    setActiveTab("studio");
    handleRevise({ sections: [sectionKey] });
  };

  const handleFixAll = () => {
    setActiveTab("studio");
    if (!revisedResume) handleRevise({ sections: "all" });
  };

  const handleDownload = async (reportId, candidateName) => {
    setDownloadError("");
    setDownloading(true);
    try {
      await downloadAtsPdf(reportId, candidateName);
      window.dispatchEvent(new Event("billing:updated"));
    } catch (err) {
      setDownloadError(
        err.response?.status === 402
          ? CREDIT_LIMIT_MESSAGE
          : err.response?.data?.message || err.message || "Failed to generate and download PDF.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    if (originalPdfUrl) window.URL.revokeObjectURL(originalPdfUrl);
    setOriginalPdfUrl(null);
    setReport(null);
    setRevisedResume(null);
    setAnalysisError("");
    setReviseError("");
    setDownloadError("");
    setActiveTab("audit");
  };

  if (!report) {
    return (
      <div className="ats-analyzer-container">
        <AtsUploadForm onAnalyze={handleAnalyze} loading={analyzing} error={analysisError} />
      </div>
    );
  }

  const analysis = report.analysis || {};
  const issues = analysis.atsCompatibility?.issues || [];

  return (
    <div className="ats-analyzer-container ats-analyzer-container--results">
      <div className="ats-results-nav">
        <button type="button" className="ats-back-btn" onClick={handleReset}>
          <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><path d="M10 3.5 5 8l5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Scan Another Resume
        </button>

        <div className="ats-main-tabs">
          <button type="button" className={`ats-main-tab ${activeTab === "audit" ? "is-active" : ""}`} onClick={() => setActiveTab("audit")}>
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            Comprehensive Audit
          </button>
          <button type="button" className={`ats-main-tab ${activeTab === "studio" ? "is-active" : ""}`} onClick={() => setActiveTab("studio")}>
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M8 2.5l1.5 3.5 3.8.3-2.9 2.5.9 3.7L8 10.7l-3.3 1.8.9-3.7-2.9-2.5 3.8-.3L8 2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            AI Rewrite & PDF Studio
            {revisedResume && <span className="ats-tab-dot" />}
          </button>
        </div>

        <div className="ats-results-nav__actions">
          {activeTab !== "studio" ? (
            <Button variant="primary" size="sm" onClick={handleFixAll}>Fix with AI</Button>
          ) : (
            <Button variant="primary" size="sm" loading={downloading} onClick={() => handleDownload(report._id, revisedResume?.contact?.fullName)}>
              Download ATS PDF
            </Button>
          )}
        </div>
      </div>

      {downloadError && <Callout tone="error" title="Download Error">{downloadError}</Callout>}

      <AtsScoreOverview
        analysis={analysis}
        fileName={report.resumeFileName}
        onFixClick={handleFixAll}
        onViewStudio={() => setActiveTab("studio")}
        hasRevised={!!revisedResume}
      />

      {activeTab === "audit" && (
        <div className="ats-audit-grid">
          <div className="ats-audit-col ats-audit-col--side">
            <section className="ats-audit-section glass-panel">
              <div className="ats-audit-section__head">
                <div>
                  <h3 className="ats-audit-section__title">ATS Compatibility Flags</h3>
                  <p className="ats-audit-section__desc">Algorithmic parsing risks that can cause text fragmentation.</p>
                </div>
                <span className="ats-audit-section__badge">{issues.length} Issues</span>
              </div>
              <AtsIssuesList issues={issues} />
            </section>
            <AtsStrengthsList strengths={analysis.strengths} />
          </div>

          <div className="ats-audit-col ats-audit-col--main">
            <AtsSectionFeedback sections={analysis.sections} onReviseSection={handleFixSection} />
            <section className="ats-audit-section glass-panel">
              <div className="ats-audit-section__head">
                <div>
                  <h3 className="ats-audit-section__title">Prioritized Recommendations</h3>
                  <p className="ats-audit-section__desc">Ranked actions to maximize search visibility and ranking.</p>
                </div>
                <span className="ats-audit-section__badge">{analysis.topSuggestions?.length || 0} Actions</span>
              </div>
              <AtsTopSuggestions suggestions={analysis.topSuggestions} />
            </section>
          </div>
        </div>
      )}

      {activeTab === "studio" && (
        <div ref={previewSectionRef} className="ats-preview-wrapper">
          <AtsBeforeAfterPreview
            reportId={report._id}
            originalText={report.rawResumeText}
            originalPdfUrl={originalPdfUrl}
            revisedResume={revisedResume}
            loading={revising}
            error={reviseError}
            onRevise={handleRevise}
            onDownload={handleDownload}
            downloading={downloading}
          />
        </div>
      )}
    </div>
  );
};

export default AtsAnalyzer;
