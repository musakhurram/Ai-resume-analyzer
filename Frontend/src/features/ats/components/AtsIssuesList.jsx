import { useState } from "react";
import AtsIcon from "./AtsIcon";

const SEV_MAP = {
  high: { tone: "high", label: "Critical" },
  medium: { tone: "medium", label: "Warning" },
  low: { tone: "low", label: "Minor" },
};

const AtsIssuesList = ({ issues = [] }) => {
  const [filter, setFilter] = useState("all");

  if (!issues || issues.length === 0) {
    return (
      <div className="ats-issues-empty">
        <span className="ats-issues-empty__icon"><AtsIcon name="checkCircle" size={18} /></span>
        <p>No ATS formatting blockers detected.</p>
      </div>
    );
  }

  // Sort: High -> Medium -> Low
  const sorted = [...issues].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  const filtered = filter === "all" ? sorted : sorted.filter((i) => i.severity === filter);

  const highCount = sorted.filter((i) => i.severity === "high").length;
  const medCount = sorted.filter((i) => i.severity === "medium").length;
  const lowCount = sorted.filter((i) => i.severity === "low").length;

  return (
    <div className="ats-issues-wrap">
      {/* Filter Chips */}
      <div className="ats-issues-filters">
        <button
          type="button"
          className={`ats-filter-btn ${filter === "all" ? "is-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({sorted.length})
        </button>
        {highCount > 0 && (
          <button
            type="button"
            className={`ats-filter-btn ats-filter-btn--high ${filter === "high" ? "is-active" : ""}`}
            onClick={() => setFilter("high")}
          >
            Critical ({highCount})
          </button>
        )}
        {medCount > 0 && (
          <button
            type="button"
            className={`ats-filter-btn ats-filter-btn--med ${filter === "medium" ? "is-active" : ""}`}
            onClick={() => setFilter("medium")}
          >
            Warnings ({medCount})
          </button>
        )}
        {lowCount > 0 && (
          <button
            type="button"
            className={`ats-filter-btn ats-filter-btn--low ${filter === "low" ? "is-active" : ""}`}
            onClick={() => setFilter("low")}
          >
            Minor ({lowCount})
          </button>
        )}
      </div>

      <div className="ats-issues-list">
        {filtered.map((item, idx) => {
          const sev = SEV_MAP[item.severity] || SEV_MAP.medium;
          return (
            <div key={idx} className={`ats-issue-card ats-issue-card--${item.severity}`}>
              <div className="ats-issue-card__head">
                <span className={`ats-issue-card__badge ats-issue-card__badge--${item.severity}`}>
                  {sev.label}
                </span>
                <h4 className="ats-issue-card__title">{item.issue}</h4>
              </div>

              <div className="ats-issue-card__fix-box">
                <span className="ats-issue-card__fix-tag">Fix:</span>
                <p className="ats-issue-card__fix-text">{item.fix}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AtsIssuesList;
