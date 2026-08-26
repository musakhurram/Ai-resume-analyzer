import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ScoreDial from "../../../shared/components/ScoreDial";
import Button from "../../../shared/components/Button";
import PageLoader from "../../../shared/components/PageLoader";
import EmptyState from "../../../shared/components/EmptyState";
import Callout from "../../../shared/components/Callout";
import { listAtsReports } from "../services/ats.api";
import "./AtsReports.scss";

const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";

const AtsReports = () => {
  const [reports, setReports] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    listAtsReports({ search: searchQuery, sort: sortBy === "newest" ? "recent" : "oldest" })
      .then((data) => { if (!cancelled) setReports(data.reports || []); })
      .catch((err) => { if (!cancelled) { setError(err.response?.data?.message || err.message || "Couldn't load reports."); setReports([]); } });
    return () => { cancelled = true; };
  }, [searchQuery, sortBy]);

  const stats = useMemo(() => {
    if (!reports?.length) return null;
    const scores = reports.map((r) => r.analysis?.overallScore || 0);
    return { count: reports.length, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), best: Math.max(...scores) };
  }, [reports]);

  if (reports === null) return <PageLoader label="Loading your reports" />;

  return (
    <div className="ats-reports-page">
      <header className="page-header">
        <div className="glow-pill"><span className="glow-pill__dot" /><span>ATS REPORT ARCHIVE</span></div>
        <h1 className="ats-reports-page__title">Past Reports</h1>
        <p className="page-header__desc">Review your previous ATS scans, track your scores, and revisit any report.</p>
      </header>

      {error && <Callout tone="error" title="Couldn't load reports">{error}</Callout>}

      {stats && <div className="ats-reports-page__stats glass-panel">
        <div className="ats-reports-page__stat-box"><span className="ats-reports-page__stat-num">{stats.count}</span><span className="ats-reports-page__stat-title">Reports Run</span></div>
        <div className="ats-reports-page__stat-divider" />
        <div className="ats-reports-page__stat-box"><span className="ats-reports-page__stat-num">{stats.avg}%</span><span className="ats-reports-page__stat-title">Average Score</span></div>
        <div className="ats-reports-page__stat-divider" />
        <div className="ats-reports-page__stat-box"><span className="ats-reports-page__stat-num">{stats.best}%</span><span className="ats-reports-page__stat-title">Best ATS Score</span></div>
      </div>}

      {reports.length > 0 && <div className="ats-reports-page__toolbar glass-panel">
        <div className="ats-reports-page__search-wrap">
          <svg viewBox="0 0 16 16" fill="none" className="ats-reports-page__search-icon" aria-hidden="true"><path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <input type="text" placeholder="Search by resume name…" className="ats-reports-page__search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {searchQuery && <button type="button" className="ats-reports-page__clear-btn" onClick={() => setSearchQuery("")}>Clear</button>}
        </div>
        <div className="ats-reports-page__sort-wrap"><label htmlFor="atsSort" className="ats-reports-page__sort-label">Sort:</label><select id="atsSort" className="ats-reports-page__sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="newest">Most Recent</option><option value="oldest">Oldest</option></select></div>
      </div>}

      {reports.length === 0 ? (
        <EmptyState eyebrow={searchQuery ? "No matches" : "No reports yet"} title={searchQuery ? "No reports match your search" : "No ATS reports yet"} description={searchQuery ? "Try another resume name, or clear your search." : "Run an ATS review to create your first saved report."} action={<Button as={Link} to="/analyze/ats-score" variant="primary">Start an ATS review</Button>} />
      ) : (
        <div className="ats-reports-page__list">
          {reports.map((report) => <Link key={report._id} to={`/ats/reports/${report._id}`} className="ats-report-card">
            <ScoreDial score={report.analysis?.overallScore ?? 0} size="sm" showLabel={false} />
            <div className="ats-report-card__body">
              <p className="ats-report-card__title">{report.title || report.resumeFileName || "ATS Resume Review"}</p>
              <p className="ats-report-card__resume"><span className="ats-report-card__resume-icon" aria-hidden="true">▧</span>{report.resumeFileName || "Resume review"}</p>
              <p className="ats-report-card__meta eyebrow">Filed {formatDate(report.createdAt)} · {report.revisedResume ? "AI optimized" : "ATS analysis"}</p>
            </div>
            <span className="ats-report-card__chevron" aria-hidden="true">›</span>
          </Link>)}
        </div>
      )}
    </div>
  );
};

export default AtsReports;
