import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ScoreDial from "../../../shared/components/ScoreDial";
import PageLoader from "../../../shared/components/PageLoader";
import EmptyState from "../../../shared/components/EmptyState";
import Callout from "../../../shared/components/Callout";
import Button from "../../../shared/components/Button";
import { listReports } from "../services/interview.api";
import { listAtsReports } from "../../ats/services/ats.api";
import { parseJobMeta } from "../../../shared/utils/jobText";
import "./Reports.scss";

const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";

const Reports = () => {
  const [reports, setReports] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([listReports(), listAtsReports({ limit: 100 })])
      .then(([interviewData, atsData]) => {
        if (cancelled) return;
        const interview = (interviewData.reports || []).map((report) => ({ ...report, reviewType: "JD Match", score: report.matchScore || 0, searchText: `${parseJobMeta(report.jobDescription).title} ${parseJobMeta(report.jobDescription).company || ""} ${report.jobDescription || ""}` }));
        const ats = (atsData.reports || []).map((report) => ({ ...report, reviewType: "ATS Review", score: report.analysis?.overallScore || 0, searchText: `${report.title || ""} ${report.resumeFileName || ""}` }));
        setReports([...interview, ...ats].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
      })
      .catch((err) => { if (!cancelled) { setError(err.response?.data?.message || err.message || "Couldn't load your past reviews."); setReports([]); } });
    return () => { cancelled = true; };
  }, []);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    let list = [...reports];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((report) => report.searchText.toLowerCase().includes(q));
    }
    if (sortBy === "oldest") list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    else list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }, [reports, searchQuery, sortBy]);

  const stats = useMemo(() => {
    if (!reports?.length) return null;
    const scores = reports.map((report) => report.score);
    return { count: reports.length, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), best: Math.max(...scores), jd: reports.filter((r) => r.reviewType === "JD Match").length, ats: reports.filter((r) => r.reviewType === "ATS Review").length };
  }, [reports]);

  if (reports === null) return <PageLoader label="Loading your past reviews" />;

  return (
    <div className="reports-page">
      <header className="page-header">
        <div className="glow-pill"><span className="glow-pill__dot" /><span>REVIEW ARCHIVE</span></div>
        <h1 className="reports-page__title">Past Reviews</h1>
        <p className="page-header__desc">One place for every JD Match and ATS review. Search your history and revisit any result.</p>
      </header>

      {error && <Callout tone="error" title="Couldn't load reviews">{error}</Callout>}

      {stats && <div className="reports-page__stats glass-panel">
        <div className="reports-page__stat-box"><span className="reports-page__stat-num">{stats.count}</span><span className="reports-page__stat-title">Reviews Run</span></div>
        <div className="reports-page__stat-divider" />
        <div className="reports-page__stat-box"><span className="reports-page__stat-num">{stats.jd}</span><span className="reports-page__stat-title">JD Match</span></div>
        <div className="reports-page__stat-divider" />
        <div className="reports-page__stat-box"><span className="reports-page__stat-num">{stats.ats}</span><span className="reports-page__stat-title">ATS Reviews</span></div>
        <div className="reports-page__stat-divider" />
        <div className="reports-page__stat-box"><span className="reports-page__stat-num">{stats.avg}%</span><span className="reports-page__stat-title">Average Score</span></div>
      </div>}

      {reports.length > 0 && <div className="reports-page__toolbar glass-panel">
        <div className="reports-page__search-wrap">
          <svg viewBox="0 0 16 16" fill="none" className="reports-page__search-icon" aria-hidden="true"><path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <input type="text" placeholder="Search by job title, company, or resume name…" className="reports-page__search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {searchQuery && <button type="button" className="reports-page__clear-btn" onClick={() => setSearchQuery("")}>Clear</button>}
        </div>
        <div className="reports-page__sort-wrap"><label htmlFor="sortSelect" className="reports-page__sort-label">Sort:</label><select id="sortSelect" className="reports-page__sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="newest">Most Recent</option><option value="oldest">Oldest</option></select></div>
      </div>}

      {!reports.length ? (
        <EmptyState eyebrow="No reviews yet" title="Your review archive is empty" description="Run a JD Match or ATS review and it will appear here automatically." action={<Button as={Link} to="/new" variant="primary">Start a review</Button>} />
      ) : !filteredReports.length ? (
        <EmptyState eyebrow="No matches" title="No reviews match your search" description="Try another name, job title, company, or resume filename." action={<Button onClick={() => setSearchQuery("")} variant="secondary">Clear search</Button>} />
      ) : (
        <div className="reports-page__list">
          {filteredReports.map((report) => {
            const isAts = report.reviewType === "ATS Review";
            const title = isAts ? (report.title || report.resumeFileName || "ATS Resume Review") : (() => { const meta = parseJobMeta(report.jobDescription); return `${meta.title}${meta.company ? ` · ${meta.company}` : ""}`; })();
            const subtitle = isAts ? (report.resumeFileName || "Resume review") : "Resume-to-job match and interview preparation";
            const href = isAts ? `/ats/reports/${report._id}` : `/reports/${report._id}`;
            return <Link key={`${report.reviewType}-${report._id}`} to={href} className="report-card report-card--unified">
              <ScoreDial score={report.score} size="sm" showLabel={false} />
              <div className="report-card__body"><div className="report-card__type">{report.reviewType}</div><p className="report-card__title">{title}</p><p className="report-card__resume">{subtitle}</p><p className="report-card__meta eyebrow">Filed {formatDate(report.createdAt)}</p></div>
              <span className="report-card__chevron" aria-hidden="true">›</span>
            </Link>;
          })}
        </div>
      )}
    </div>
  );
};

export default Reports;
