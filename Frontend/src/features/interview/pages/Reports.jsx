import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import { listReports } from "../services/interview.api";
import ReportCard from "../components/ReportCard";
import PageLoader from "../../../shared/components/PageLoader";
import EmptyState from "../../../shared/components/EmptyState";
import Callout from "../../../shared/components/Callout";
import Button from "../../../shared/components/Button";
import { parseJobMeta } from "../../../shared/utils/jobText";
import "./Reports.scss";

const Reports = () => {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    let cancelled = false;
    listReports()
      .then((data) => {
        if (!cancelled) setReports(data.reports || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || "Couldn't load reports.");
          setReports([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    if (!reports || !reports.length) return null;
    const count = reports.length;
    const scores = reports.map((r) => r.matchScore || 0);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / count);
    const maxScore = Math.max(...scores);
    return { count, avgScore, maxScore };
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    let list = [...reports];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => {
        const meta = parseJobMeta(r.jobDescription);
        const titleMatch = meta.title.toLowerCase().includes(q);
        const compMatch = meta.company?.toLowerCase().includes(q);
        const textMatch = r.jobDescription?.toLowerCase().includes(q);
        return titleMatch || compMatch || textMatch;
      });
    }

    if (sortBy === "highest") {
      list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (sortBy === "lowest") {
      list.sort((a, b) => (a.matchScore || 0) - (b.matchScore || 0));
    } else {
      // newest
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [reports, searchQuery, sortBy]);

  if (reports === null) {
    return <PageLoader label="Loading your reports" />;
  }

  return (
    <div className="reports-page">
      <header className="page-header">
        <div className="glow-pill">
          <span className="glow-pill__dot" />
          <span>REPORT ARCHIVE</span>
        </div>
        <h1 className="reports-page__title">Past Reports</h1>
        <p className="page-header__desc">
          Review past resume-to-job comparisons, track how your scores have changed, and revisit any report.
        </p>
      </header>

      {error && <Callout tone="error" title="Couldn't load reports">{error}</Callout>}

      {/* Stats Overview HUD */}
      {stats && (
        <div className="reports-page__stats glass-panel">
          <div className="reports-page__stat-box">
            <span className="reports-page__stat-num">{stats.count}</span>
            <span className="reports-page__stat-title">Reports Run</span>
          </div>
          <div className="reports-page__stat-divider" />
          <div className="reports-page__stat-box">
            <span className="reports-page__stat-num">{stats.avgScore}%</span>
            <span className="reports-page__stat-title">Average Score</span>
          </div>
          <div className="reports-page__stat-divider" />
          <div className="reports-page__stat-box">
            <span className="reports-page__stat-num">{stats.maxScore}%</span>
            <span className="reports-page__stat-title">Best Match Score</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      {reports.length > 0 && (
        <div className="reports-page__toolbar glass-panel">
          <div className="reports-page__search-wrap">
            <svg viewBox="0 0 16 16" fill="none" className="reports-page__search-icon" aria-hidden="true">
              <path
                d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by job title, stack, or company…"
              className="reports-page__search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="reports-page__clear-btn"
                onClick={() => setSearchQuery("")}
              >
                Clear
              </button>
            )}
          </div>

          <div className="reports-page__sort-wrap">
            <label htmlFor="sortSelect" className="reports-page__sort-label">Sort:</label>
            <select
              id="sortSelect"
              className="reports-page__sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Most Recent</option>
              <option value="highest">Highest Score</option>
              <option value="lowest">Lowest Score</option>
            </select>
          </div>
        </div>
      )}

      {reports.length === 0 ? (
        <EmptyState
          eyebrow="No reports yet"
          title="No reports yet"
          description="Run your resume against a job description to see your match score and get an interview prep plan."
          action={
            <Button as={Link} to="/new" variant="primary">
              Start a review
            </Button>
          }
        />
      ) : filteredReports.length === 0 ? (
        <EmptyState
          eyebrow="No matches"
          title="No reports match your search"
          description="Try a different search term, or clear your search."
          action={
            <Button onClick={() => setSearchQuery("")} variant="secondary">
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="reports-page__list">
          {filteredReports.map((report) => (
            <ReportCard key={report._id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;

