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

const ReportDetail = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

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

  return (
    <div className="report-detail">
      <div className="report-detail__toprow">
        <Link to="/reports" className="report-detail__back">
          ← Back to reports
        </Link>
        <Button variant="secondary" size="sm" loading={downloading} onClick={handleDownloadPdf}>
          Download PDF
        </Button>
      </div>

      {downloadError && <Callout tone="error">{downloadError}</Callout>}

      <header className="report-detail__header">
        <ScoreDial score={report.matchScore} />
        <div className="report-detail__summary">
          <p className="eyebrow">
            Filed {formatDate(report.createdAt)}
            {resumeName && <> · {resumeName}</>}
          </p>
          <h1>
            {title}
            {company && <span className="report-detail__company"> at {company}</span>}
          </h1>
          <p className="report-detail__job">{stripMarkdown(report.jobDescription)}</p>
        </div>
      </header>

      <div className="report-detail__grid">
        <div className="report-detail__col report-detail__col--side">
          <section className="report-detail__section">
            <h2>Skill gaps</h2>
            <p className="report-detail__section-desc">
              Where the resume falls short of what this role is asking for.
            </p>
            <SkillGapList gaps={report.skillGaps} />
          </section>

          {report.selfDescription && (
            <section className="report-detail__section">
              <h2>What you told us</h2>
              <p className="report-detail__self">{report.selfDescription}</p>
            </section>
          )}
        </div>

        <div className="report-detail__col">
          <section className="report-detail__section">
            <h2>Technical questions</h2>
            <p className="report-detail__section-desc">
              Likely to come up given the stack and requirements in this posting.
            </p>
            <QuestionAccordion questions={report.technicalQuestions} />
          </section>

          <section className="report-detail__section">
            <h2>Behavioral questions</h2>
            <p className="report-detail__section-desc">
              Framed around what the resume shows — and doesn't.
            </p>
            <QuestionAccordion questions={report.behavioralQuestions} />
          </section>

          <section className="report-detail__section">
            <h2>Preparation plan</h2>
            <p className="report-detail__section-desc">
              A day-by-day path from here to interview-ready.
            </p>
            <PrepTimeline plan={report.preparationPlan} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
