import Badge from "../../../shared/components/Badge";

const SEV_MAP = {
  high: { tone: "high", label: "Critical" },
  medium: { tone: "medium", label: "Warning" },
  low: { tone: "low", label: "Minor" },
};

const AtsIssuesList = ({ issues = [] }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="ats-issues-empty">
        <span className="ats-issues-empty__icon">✓</span>
        <p>No critical ATS formatting blockers detected in this resume.</p>
      </div>
    );
  }

  // Sort: High -> Medium -> Low
  const sorted = [...issues].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  return (
    <div className="ats-issues-list">
      {sorted.map((item, idx) => {
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
              <span className="ats-issue-card__fix-tag">Recommended Fix:</span>
              <p className="ats-issue-card__fix-text">{item.fix}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AtsIssuesList;
