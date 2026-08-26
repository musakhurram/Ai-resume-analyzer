import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Button from "../../../shared/components/Button";
import PageLoader from "../../../shared/components/PageLoader";
import EmptyState from "../../../shared/components/EmptyState";
import Callout from "../../../shared/components/Callout";
import { listAtsReports } from "../services/ats.api";
import "./AtsReports.scss";

const AtsReports = () => {
  const [reports, setReports] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    listAtsReports({ search, sort })
      .then((data) => !cancelled && setReports(data.reports || []))
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || "Couldn't load your reports.");
          setReports([]);
        }
      });
    return () => { cancelled = true; };
  }, [search, sort]);

  const stats = useMemo(() => {
    if (!reports?.length) return null;
    const scores = reports.map((report) => report.analysis?.overallScore || 0);
    return { count: reports.length, average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), best: Math.max(...scores) };
  }, [reports]);

  if (reports === null) return <PageLoader label="Loading your ATS reports" />;

  return (
    <main className="ats-reports-page">
      <header className="ats-reports-hero">
        <div>
          <div className="glow-pill"><span className="glow-pill__dot" /><span>ATS ARCHIVE</span></div>
          <h1>Past Reports</h1>
          <p>Review your previous resume scans and pick up where you left off.</p>
        </div>
        <Button as={Link} to="/analyze/ats-score" variant="primary">+ New ATS Review</Button>
      </header>

      {error && <Callout tone="error" title="Couldn't load reports">{error}</Callout>}

      {stats && <section className="ats-reports-summary glass-panel" aria-label="Report summary">
        <div><span>Total reports</span><strong>{stats.count}</strong></div>
        <div><span>Average score</span><strong>{stats.average}%</strong></div>
        <div><span>Best score</span><strong>{stats.best}%</strong></div>
      </section>}

      <section className="ats-reports-controls glass-panel">
        <label className="ats-reports-search">
          <span aria-hidden="true">⌕</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by resume name…" aria-label="Search reports by resume name" />
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
        </label>
        <label className="ats-reports-sort">
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort reports">
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest</option>
          </select>
        </label>
      </section>

      {!reports.length ? (
        <EmptyState eyebrow="No reports found" title={search ? "No matching reports" : "Your ATS archive is empty"} description={search ? "Try another resume name or clear your search." : "Run an ATS review and your report will automatically appear here."} action={<Button as={Link} to="/analyze/ats-score" variant="primary">Run ATS Review</Button>} />
      ) : (
        <section className="ats-reports-list" aria-label="ATS reports">
          {reports.map((report) => {
            const score = report.analysis?.overallScore ?? 0;
            return <Link key={report._id} to={`/ats/reports/${report._id}`} className="ats-report-card glass-panel">
              <div className="ats-report-card__score"><strong>{score}</strong><span>/100</span></div>
              <div className="ats-report-card__content"><div className="ats-report-card__eyebrow">ATS REVIEW</div><h2>{report.title || report.resumeFileName || "Resume Review"}</h2><p>{report.resumeFileName || "Resume"}</p><div className="ats-report-card__meta"><span>{new Date(report.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span><span>{report.revisedResume ? "AI optimized" : "ATS analysis"}</span></div></div>
              <span className="ats-report-card__arrow" aria-hidden="true">→</span>
            </Link>;
          })}
        </section>
      )}
    </main>
  );
};

export default AtsReports;
