import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Button from "../../../shared/components/Button";
import PageLoader from "../../../shared/components/PageLoader";
import EmptyState from "../../../shared/components/EmptyState";
import Callout from "../../../shared/components/Callout";
import { listAtsReports } from "../services/ats.api";
import "./AtsReports.scss";

const CATEGORIES = [
  { value: "all", label: "All Reviews" },
  { value: "general", label: "General" },
  { value: "job-targeted", label: "Job Targeted" },
  { value: "optimized", label: "AI Optimized" },
];

const categoryLabel = (category) =>
  CATEGORIES.find((item) => item.value === category)?.label || "General";

const AtsReports = () => {
  const [reports, setReports] = useState(null);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    listAtsReports({ category, search })
      .then((data) => !cancelled && setReports(data.reports || []))
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || "Couldn't load ATS history.");
          setReports([]);
        }
      });
    return () => { cancelled = true; };
  }, [category, search]);

  const stats = useMemo(() => {
    if (!reports?.length) return null;
    const scores = reports.map((report) => report.analysis?.overallScore || 0);
    return {
      count: reports.length,
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      best: Math.max(...scores),
    };
  }, [reports]);

  if (reports === null) return <PageLoader label="Loading ATS report history" />;

  return (
    <div className="ats-reports-page">
      <header className="page-header">
        <div className="glow-pill"><span className="glow-pill__dot" /><span>ATS ARCHIVE</span></div>
        <h1 className="ats-reports-page__title">Past ATS Reviews</h1>
        <p className="page-header__desc">
          Revisit previous ATS audits, compare scores, and open any saved review without running the analysis again.
        </p>
      </header>

      {error && <Callout tone="error" title="Couldn't load ATS history">{error}</Callout>}

      {stats && (
        <div className="ats-reports-page__stats glass-panel">
          <div><strong>{stats.count}</strong><span>Reviews</span></div>
          <div><strong>{stats.average}%</strong><span>Average Score</span></div>
          <div><strong>{stats.best}%</strong><span>Best Score</span></div>
        </div>
      )}

      <div className="ats-reports-page__toolbar glass-panel">
        <input
          className="ats-reports-page__search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search resume name or review title…"
          aria-label="Search ATS reports"
        />
        <div className="ats-reports-page__filters" role="tablist" aria-label="ATS report categories">
          {CATEGORIES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={category === item.value ? "is-active" : ""}
              onClick={() => setCategory(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {!reports.length ? (
        <EmptyState
          eyebrow="No ATS reviews"
          title="Your ATS archive is empty"
          description="Analyze a resume and the review will automatically appear here for your account."
          action={<Button as={Link} to="/analyze/ats-score" variant="primary">Run ATS Review</Button>}
        />
      ) : (
        <div className="ats-reports-page__grid">
          {reports.map((report) => {
            const score = report.analysis?.overallScore ?? 0;
            return (
              <Link key={report._id} to={`/ats/reports/${report._id}`} className="ats-report-card glass-panel">
                <div className="ats-report-card__top">
                  <span className="ats-report-card__category">{categoryLabel(report.category)}</span>
                  <strong>{score}%</strong>
                </div>
                <h2>{report.title || "ATS Resume Review"}</h2>
                <p>{report.resumeFileName || "Resume"}</p>
                <div className="ats-report-card__meta">
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  <span>{report.revisedResume ? "AI optimized" : "Audit only"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AtsReports;
