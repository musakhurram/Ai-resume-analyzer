import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getReportById, downloadReportPdf } from "../services/interview.api";
import ScoreDial from "../../../shared/components/ScoreDial";
import SkillGapList from "../components/SkillGapList";
import QuestionAccordion from "../components/QuestionAccordion";
import PrepTimeline from "../components/PrepTimeline";
import PageLoader from "../../../shared/components/PageLoader";
import Callout from "../../../shared/components/Callout";
import Button from "../../../shared/components/Button";
import { parseJobMeta, stripMarkdown } from "../../../shared/utils/jobText";
import { recallResumeName } from "../../../shared/utils/resumeLabel";
import "./ReportDetail.scss";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getFitBadge(score) {
  if (score >= 85) return { label: "Strong match", tone: "low" };
  if (score >= 70) return { label: "Good match", tone: "medium" };
  return { label: "Needs work", tone: "high" };
}

const ReportDetail = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [expandedJd, setExpandedJd] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getReportById(id)
      .then((data) => {
        if (!cancelled) {
          setReport(data.interviewReport);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || "Couldn't load this report.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isLoadingCurrent = !error && (!report || report._id !== id);

  if (error) {
    return (
      <div className="report-detail">
        <Callout tone="error" title="Couldn't open this report">{error}</Callout>
        <Link to="/reports" className="report-detail__back">
          ← Back to reports
        </Link>
      </div>
    );
  }

  if (isLoadingCurrent) {
    return <PageLoader label="Opening report" />;
  }

  const { title, company } = parseJobMeta(report.jobDescription);
  const resumeName = recallResumeName(report._id);
  const fit = getFitBadge(report.matchScore || 0);

  const handleDownloadPdf = async () => {
    setDownloadError("");
    setDownloading(true);
    try {
      await downloadReportPdf(report._id);
    } catch (err) {
      setDownloadError(err.response?.data?.message || err.message || "Couldn't generate the PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopySummary = () => {
    const summaryText = `--- INTERVIEW PREP SUMMARY ---
Role: ${title} ${company ? `at ${company}` : ""}
Match Score: ${report.matchScore}% (${fit.label})
Resume: ${resumeName || "Uploaded Resume"}
Date: ${formatDate(report.createdAt)}

SKILL GAPS (${report.skillGaps?.length || 0}):
${report.skillGaps?.map((g) => `- [${g.severity?.toUpperCase()}] ${g.skill}`).join("\n") || "None"}

TECHNICAL QUESTIONS (${report.technicalQuestions?.length || 0}):
${report.technicalQuestions?.map((q, i) => `${i + 1}. ${q.question}`).join("\n") || "None"}

7-DAY PREPARATION PLAN:
${report.preparationPlan?.map((p) => `Day ${p.day}: ${p.focus} - ${p.tasks}`).join("\n") || "None"}
`;
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="report-detail">
      {/* Top Toolbar */}
      <div className="report-detail__toprow">
        <Link to="/reports" className="report-detail__back">
          <svg viewBox="0 0 16 16" fill="none" className="report-detail__back-icon" aria-hidden="true">
            <path d="M10 3.5 5 8l5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to reports
        </Link>

        <div className="report-detail__actions">
          <Button variant="secondary" size="sm" onClick={handleCopySummary}>
            {copied ? "Copied" : "Copy summary"}
          </Button>
          <Button variant="primary" size="sm" loading={downloading} onClick={handleDownloadPdf}>
    <span className="report-detail__pdf-btn-content">
      Download PDF
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="report-detail__pdf-icon"
        width={16}
        height={16}
      >
        <path
          d="M8 2v8m0 0 3-3m-3 3-3-3M3 12v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  </Button>
        </div>
      </div>

      {downloadError && <Callout tone="error">{downloadError}</Callout>}

      {/* Report header */}
      <header className="report-detail__header glass-panel">
        <div className="report-detail__score-wrap">
          <ScoreDial score={report.matchScore} size="lg" />
          <span className={`report-detail__fit-pill report-detail__fit-pill--${fit.tone}`}>
            {fit.label}
          </span>
        </div>

        <div className="report-detail__summary">
          <div className="report-detail__eyebrow-row">
            <span className="eyebrow">Report #{report._id.slice(-6).toUpperCase()}</span>
            <span className="report-detail__dot" />
            <span className="report-detail__date">Filed {formatDate(report.createdAt)}</span>
            {resumeName && (
              <>
                <span className="report-detail__dot" />
                <span className="report-detail__resume-tag">📄 {resumeName}</span>
              </>
            )}
          </div>

          <h1 className="report-detail__title">
            {title}
            {company && <span className="report-detail__company"> · {company}</span>}
          </h1>

          <div className="report-detail__job-box">
            <p className={`report-detail__job ${expandedJd ? "is-expanded" : ""}`}>
              {stripMarkdown(report.jobDescription)}
            </p>
            <button
              type="button"
              className="report-detail__expand-btn"
              onClick={() => setExpandedJd(!expandedJd)}
            >
              {expandedJd ? "Show less" : "Read full job description"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Analysis Grid */}
      <div className="report-detail__grid">
        {/* Left Column: Skill Gaps & Strategic Notes */}
        <div className="report-detail__col report-detail__col--side">
          <section className="report-detail__section glass-panel">
            <div className="report-detail__section-header">
              <h2>Skill gaps</h2>
              <span className="report-detail__count-badge">{report.skillGaps?.length || 0}</span>
            </div>
            <p className="report-detail__section-desc">
              Areas where the resume doesn't clearly cover what the role asks for.
            </p>
            <SkillGapList gaps={report.skillGaps} />
          </section>

          {report.selfDescription && (
            <section className="report-detail__section glass-panel">
              <div className="report-detail__section-header">
                <h2>Additional context</h2>
              </div>
              <p className="report-detail__self">{report.selfDescription}</p>
            </section>
          )}
        </div>

        {/* Right Column: Questions & Preparation Plan */}
        <div className="report-detail__col">
          <section className="report-detail__section glass-panel">
            <div className="report-detail__section-header">
              <h2>Likely technical questions</h2>
              <span className="report-detail__count-badge">{report.technicalQuestions?.length || 0}</span>
            </div>
            <p className="report-detail__section-desc">
              Questions tailored to the technologies and systems in this role.
            </p>
            <QuestionAccordion questions={report.technicalQuestions} />
          </section>

          <section className="report-detail__section glass-panel">
            <div className="report-detail__section-header">
              <h2>Behavioral questions</h2>
              <span className="report-detail__count-badge">{report.behavioralQuestions?.length || 0}</span>
            </div>
            <p className="report-detail__section-desc">
              Questions about leadership, conflict, and delivering under pressure.
            </p>
            <QuestionAccordion questions={report.behavioralQuestions} />
          </section>

          <section className="report-detail__section glass-panel">
            <div className="report-detail__section-header">
              <h2>7-day preparation plan</h2>
              <span className="report-detail__count-badge">7 days</span>
            </div>
            <p className="report-detail__section-desc">
              A day-by-day plan to help you prepare without cramming.
            </p>
            <PrepTimeline plan={report.preparationPlan} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;

