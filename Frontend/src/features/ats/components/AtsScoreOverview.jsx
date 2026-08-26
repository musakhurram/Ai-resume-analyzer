import ScoreDial from "../../../shared/components/ScoreDial";
import Badge from "../../../shared/components/Badge";

function getScoreTier(score = 0) {
  if (score >= 85) {
    return {
      label: "ATS OPTIMIZED (GRADE A)",
      tone: "low",
      summary: "Resume structure and keywords align with top ATS screening criteria.",
    };
  }
  if (score >= 70) {
    return {
      label: "COMPETITIVE (GRADE B)",
      tone: "medium",
      summary: "Solid foundation, but critical formatting or action-verb tweaks will boost ranking.",
    };
  }
  return {
    label: "NEEDS OPTIMIZATION (GRADE C)",
    tone: "high",
    summary: "Significant ATS parsing or content risks detected that may cause automated rejection.",
  };
}

const AtsScoreOverview = ({ analysis, fileName, onFixClick, onViewStudio, hasRevised }) => {
  const overallScore = analysis?.overallScore ?? 0;
  const atsCompatibility = analysis?.atsCompatibility || { score: 0, issues: [] };
  const tier = getScoreTier(overallScore);
  const issues = atsCompatibility.issues || [];
  const highCount = issues.filter((i) => i.severity === "high").length;
  const medCount = issues.filter((i) => i.severity === "medium").length;
  const lowCount = issues.filter((i) => i.severity === "low").length;

  return (
    <div className="ats-score-overview glass-panel">
      <div className="ats-score-overview__main">
        <div className="ats-score-overview__dial-col">
          <ScoreDial score={overallScore} size="md" />
          <span className={`ats-score-overview__tier-pill ats-score-overview__tier-pill--${tier.tone}`}>
            {tier.label}
          </span>
        </div>

        <div className="ats-score-overview__details">
          <div className="ats-score-overview__eyebrow-row">
            <span className="eyebrow">ATS READINESS</span>
            <span className="ats-score-overview__dot" />
            <span className="ats-score-overview__file">📄 {fileName || "Uploaded Resume"}</span>
          </div>

          <h2 className="ats-score-overview__heading">
            ATS Compatibility Score: <span className="ats-score-overview__accent-num">{overallScore}/100</span>
          </h2>
          <p className="ats-score-overview__summary">{tier.summary}</p>

          <div className="ats-score-overview__chips">
            <div className="ats-score-overview__chip">
              <span className="ats-score-overview__chip-label">Parser Score:</span>
              <span className="ats-score-overview__chip-val">{atsCompatibility.score}%</span>
            </div>
            <div className="ats-score-overview__chip">
              <span className="ats-score-overview__chip-label">Total Flags:</span>
              <span className="ats-score-overview__chip-val">{issues.length}</span>
            </div>
            {highCount > 0 && (
              <div className="ats-score-overview__chip ats-score-overview__chip--danger">
                <span className="ats-score-overview__chip-dot" />
                <span>{highCount} Critical</span>
              </div>
            )}
          </div>
        </div>

        <div className="ats-score-overview__action-col">
          <button
            type="button"
            className="ats-score-overview__fix-btn button button--primary button--md"
            onClick={onFixClick}
          >
            <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
              <path
                d="M10 2.5l1.8 4.2 4.5.4-3.4 3 1 4.4L10 12.2l-3.9 2.3 1-4.4-3.4-3 4.5-.4L10 2.5z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {hasRevised ? "Open AI Studio" : "Fix with AI"}
          </button>
          <span className="ats-score-overview__fix-note">Rewrites to clean ATS PDF</span>
        </div>
      </div>

      {/* Severity counter bar */}
      <div className="ats-score-overview__stat-strip">
        <div className="ats-stat-item">
          <span className="ats-stat-item__num ats-stat-item__num--high">{highCount}</span>
          <span className="ats-stat-item__label">Critical</span>
        </div>
        <div className="ats-stat-item">
          <span className="ats-stat-item__num ats-stat-item__num--med">{medCount}</span>
          <span className="ats-stat-item__label">Warnings</span>
        </div>
        <div className="ats-stat-item">
          <span className="ats-stat-item__num ats-stat-item__num--low">{lowCount}</span>
          <span className="ats-stat-item__label">Minor</span>
        </div>
        <div className="ats-stat-item">
          <span className="ats-stat-item__num ats-stat-item__num--accent">
            {analysis?.strengths?.length || 0}
          </span>
          <span className="ats-stat-item__label">Strengths</span>
        </div>
      </div>
    </div>
  );
};

export default AtsScoreOverview;
