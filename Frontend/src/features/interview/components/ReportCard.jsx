import { Link } from "react-router";
import ScoreDial from "../../../shared/components/ScoreDial";
import { parseJobMeta } from "../../../shared/utils/jobText";
import { recallResumeName } from "../../../shared/utils/resumeLabel";
import "./ReportCard.scss";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ReportCard = ({ report }) => {
  const { title, company } = parseJobMeta(report.jobDescription);
  const resumeName = recallResumeName(report._id);

  return (
    <Link to={`/reports/${report._id}`} className="report-card">
      <ScoreDial score={report.matchScore} size="sm" />
      <div className="report-card__body">
        <p className="report-card__title">
          {title}
          {company && <span className="report-card__company"> · {company}</span>}
        </p>
        <p className="report-card__resume">
          {resumeName ? (
            <>
              <span className="report-card__resume-icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 1.5h5.5L13 5v9a.5.5 0 0 1-.5.5h-8A.5.5 0 0 1 4 14V2a.5.5 0 0 1 .5-.5Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <path d="M9.5 1.5V5H13" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </span>
              {resumeName}
            </>
          ) : (
            "Resume review"
          )}
        </p>
        <p className="report-card__meta eyebrow">
          Filed {formatDate(report.createdAt)} · {report.technicalQuestions?.length || 0} technical ·{" "}
          {report.behavioralQuestions?.length || 0} behavioral
        </p>
      </div>
      <span className="report-card__chevron" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M6 3.5 11 8l-5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
};

export default ReportCard;
