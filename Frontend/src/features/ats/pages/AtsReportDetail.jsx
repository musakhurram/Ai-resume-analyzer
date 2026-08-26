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
import { getAtsReportById, downloadAtsPdf } from "../services/ats.api";
import "./AtsAnalyzer.scss";

const AtsReportDetail = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getAtsReportById(id)
      .then((data) => setReport(data.atsReport))
      .catch((err) => setError(err.response?.data?.message || err.message || "Couldn't load ATS report."));
  }, [id]);

  if (!report && !error) return <PageLoader label="Loading ATS report" />;
  if (error) return <Callout tone="error" title="Report unavailable">{error}</Callout>;

  const analysis = report.analysis || {};
  const issues = analysis.atsCompatibility?.issues || [];

  const handleDownload = async () => {
    setDownloading(true);
    try { await downloadAtsPdf(report._id, report.resumeFileName); }
    catch (err) { setError(err.response?.data?.message || err.message || "Failed to download PDF."); }
    finally { setDownloading(false); }
  };

  return (
    <div className="ats-analyzer-container ats-analyzer-container--results">
      <div className="ats-results-nav">
        <Link className="ats-back-btn" to="/ats/reports">← Back to ATS History</Link>
        <div className="ats-results-nav__actions">
          <Button variant="primary" size="sm" loading={downloading} onClick={handleDownload}>Download ATS PDF</Button>
        </div>
      </div>

      <AtsScoreOverview analysis={analysis} fileName={report.resumeFileName} hasRevised={!!report.revisedResume} />
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
    </div>
  );
};

export default AtsReportDetail;
