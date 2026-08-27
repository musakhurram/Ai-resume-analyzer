import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import Button from "../../../shared/components/Button";
import PageLoader from "../../../shared/components/PageLoader";
import Callout from "../../../shared/components/Callout";
import AtsScoreOverview from "../components/AtsScoreOverview";
import AtsIssuesList from "../components/AtsIssuesList";
import AtsSectionFeedback from "../components/AtsSectionFeedback";
import AtsTopSuggestions from "../components/AtsTopSuggestions";
import AtsStrengthsList from "../components/AtsStrengthsList";
import AtsGitDiffComparison from "../components/AtsGitDiffComparison";
import { getAtsReportById, reviseAtsResume, downloadAtsPdf } from "../services/ats.api";
import "./AtsAnalyzer.scss";

const AtsReportDetail = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [revisedResume, setRevisedResume] = useState(null);
  const [revising, setRevising] = useState(false);
  const [reviseError, setReviseError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [activeView, setActiveView] = useState("audit");

  useEffect(() => {
    let cancelled = false;
    getAtsReportById(id)
      .then((data) => {
        if (cancelled) return;
        const savedReport = data.atsReport;
        setReport(savedReport);
        setRevisedResume(savedReport.revisedResume || null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || "Couldn't load ATS report.");
      });
    return () => { cancelled = true; };
  }, [id]);

  if (!report && !error) return <PageLoader label="Loading ATS report" />;
  if (error) return <Callout tone="error" title="Report unavailable">{error}</Callout>;

  const analysis = report.analysis || {};
  const issues = analysis.atsCompatibility?.issues || [];

  const handleRevise = async ({ sections = "all", customNotes = "" } = {}) => {
    setReviseError("");
    setRevising(true);
    try {
      const data = await reviseAtsResume({ id: report._id, sections, customNotes });
      setRevisedResume(data.revisedResume);
      setReport((prev) => ({ ...prev, revisedResume: data.revisedResume }));
      setActiveView("studio");
    } catch (err) {
      setReviseError(err.response?.data?.message || err.message || "Failed to revise resume with AI. Please try again.");
    } finally {
      setRevising(false);
    }
  };

  const handleFixAll = () => {
    setActiveView("studio");
    if (!revisedResume) handleRevise({ sections: "all" });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadAtsPdf(report._id, revisedResume?.contact?.fullName || report.resumeFileName);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to download PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="ats-analyzer-container ats-analyzer-container--results">
      <div className="ats-results-nav">
        <Link className="ats-back-btn" to="/reports">← Back to Past Reviews</Link>
        <div className="ats-main-tabs">
          <button type="button" className={`ats-main-tab ${activeView === "audit" ? "is-active" : ""}`} onClick={() => setActiveView("audit")}>
            Comprehensive Audit
          </button>
          <button type="button" className={`ats-main-tab ${activeView === "studio" ? "is-active" : ""}`} onClick={() => setActiveView("studio")}>
            AI Rewrite & PDF Studio
            {revisedResume && <span className="ats-tab-dot" />}
          </button>
        </div>
        <div className="ats-results-nav__actions">
          {activeView === "studio" && revisedResume ? (
            <Button variant="primary" size="sm" loading={downloading} onClick={handleDownload}>Download ATS PDF</Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleFixAll} loading={revising}>Fix with AI</Button>
          )}
        </div>
      </div>

      {reviseError && <Callout tone="error" title="AI Revision Issue">{reviseError}</Callout>}

      <AtsScoreOverview analysis={analysis} fileName={report.resumeFileName} onFixClick={handleFixAll} hasRevised={!!revisedResume} />

      {activeView === "audit" ? (
        <div className="ats-audit-grid">
          <div className="ats-audit-col ats-audit-col--side">
            <section className="ats-audit-section glass-panel">
              <div className="ats-audit-section__head"><div><h3 className="ats-audit-section__title">ATS Compatibility Flags</h3><p className="ats-audit-section__desc">Saved issues from this review.</p></div><span className="ats-audit-section__badge">{issues.length} Issues</span></div>
              <AtsIssuesList issues={issues} />
            </section>
            <AtsStrengthsList strengths={analysis.strengths} />
          </div>
          <div className="ats-audit-col ats-audit-col--main">
            <AtsSectionFeedback sections={analysis.sections} />
            <section className="ats-audit-section glass-panel">
              <div className="ats-audit-section__head"><div><h3 className="ats-audit-section__title">Prioritized Recommendations</h3><p className="ats-audit-section__desc">Saved recommendations from this review.</p></div></div>
              <AtsTopSuggestions suggestions={analysis.topSuggestions} />
            </section>
          </div>
        </div>
      ) : (
        <div className="ats-preview-wrapper">
          <AtsGitDiffComparison
            reportId={report._id}
            originalText={report.rawResumeText}
            revisedResume={revisedResume}
            loading={revising}
            onRevise={handleRevise}
            onDownload={async (reportId, candidateName) => {
              setDownloading(true);
              try { await downloadAtsPdf(reportId, candidateName || report.resumeFileName); }
              catch (err) { setReviseError(err.response?.data?.message || err.message || "Failed to download PDF."); }
              finally { setDownloading(false); }
            }}
            downloading={downloading}
          />
        </div>
      )}
    </div>
  );
};

export default AtsReportDetail;
