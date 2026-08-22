import { Link } from "react-router";
import ScoreDial from "../../../shared/components/ScoreDial";
import "./ReportCard.scss";

function excerpt(text, max = 120) {
  if (!text) return "Untitled role";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ReportCard = ({ report }) => {
  return (
    <Link to={`/reports/${report._id}`} className="report-card">
      <ScoreDial score={report.matchScore} size="sm" />
      <div className="report-card__body">
        <p className="report-card__excerpt">{excerpt(report.jobDescription)}</p>
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
