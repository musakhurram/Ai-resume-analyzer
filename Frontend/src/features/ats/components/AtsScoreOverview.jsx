import ScoreDial from "../../../shared/components/ScoreDial";
import AtsIcon from "./AtsIcon";

function getScoreTier(score = 0) {
  if (score >= 85) return { label: "STRONG", tone: "low", summary: "Your resume has strong ATS compatibility and a solid overall structure." };
  if (score >= 70) return { label: "GOOD", tone: "medium", summary: "Your resume is competitive, but a few improvements can increase ATS performance." };
  if (score >= 50) return { label: "NEEDS IMPROVEMENT", tone: "medium", summary: "Your resume has a workable foundation but several areas should be optimized." };
  return { label: "WEAK", tone: "high", summary: "Significant ATS or resume-quality issues may reduce your chances of passing screening." };
}

const BREAKDOWN_LABELS = {
  atsCompatibility: "Parser / ATS",
  contactInfo: "Contact Info",
  summary: "Summary",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  formatting: "Formatting",
};

const AtsScoreOverview = ({ analysis, fileName, onFixClick, hasRevised }) => {
  const overallScore = Number(analysis?.overallScore ?? 0);
  const atsCompatibility = analysis?.atsCompatibility || { score: 0, issues: [] };
  const parserScore = Number(atsCompatibility.score ?? 0);
  const tier = getScoreTier(overallScore);
  const issues = atsCompatibility.issues || [];
  const highCount = issues.filter((i) => i.severity === "high").length;
  const medCount = issues.filter((i) => i.severity === "medium").length;
  const lowCount = issues.filter((i) => i.severity === "low").length;
  const breakdown = analysis?.scoreBreakdown || {};
  const breakdownEntries = Object.entries(BREAKDOWN_LABELS).filter(([key]) => breakdown[key]);

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
            <span className="eyebrow">ATS REVIEW</span>
            <span className="ats-score-overview__dot" />
            <span className="ats-score-overview__file"><AtsIcon name="file" size={14} />{fileName || "Uploaded Resume"}</span>
          </div>

          <h2 className="ats-score-overview__heading">
            Overall ATS Score: <span className="ats-score-overview__accent-num">{overallScore}/100</span>
          </h2>
          <p className="ats-score-overview__summary">Resume Strength: <strong>{tier.label}</strong> — {tier.summary}</p>

          <div className="ats-score-overview__chips">
            <div className="ats-score-overview__chip">
              <span className="ats-score-overview__chip-label">Parser Score:</span>
              <span className="ats-score-overview__chip-val">{parserScore}/100</span>
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

          {breakdownEntries.length > 0 && (
            <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.6rem" }}>
              {breakdownEntries.map(([key]) => {
                const score = Number(breakdown[key]?.score ?? 0);
                return (
                  <div key={key} style={{ padding: "0.65rem 0.75rem", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--surface-2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.72rem", color: "var(--ink-muted)" }}>
                      <span>{BREAKDOWN_LABELS[key]}</span>
                      <strong style={{ color: "var(--ink)" }}>{score}/100</strong>
                    </div>
                    <div style={{ marginTop: "0.45rem", height: "5px", borderRadius: "999px", background: "var(--surface-3)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.max(0, Math.min(100, score))}%`, height: "100%", background: "var(--accent)", borderRadius: "inherit" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="ats-score-overview__action-col">
          <button type="button" className="ats-score-overview__fix-btn button button--primary button--md" onClick={onFixClick}>
            <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
              <path d="M10 2.5l1.8 4.2 4.5.4-3.4 3 1 4.4L10 12.2l-3.9 2.3 1-4.4-3.4-3 4.5-.4L10 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {hasRevised ? "Open AI Studio" : "Fix with AI"}
          </button>
          <span className="ats-score-overview__fix-note">Rewrites to clean ATS PDF</span>
        </div>
      </div>

      <div className="ats-score-overview__stat-strip">
        <div className="ats-stat-item"><span className="ats-stat-item__num ats-stat-item__num--high">{highCount}</span><span className="ats-stat-item__label">Critical</span></div>
        <div className="ats-stat-item"><span className="ats-stat-item__num ats-stat-item__num--med">{medCount}</span><span className="ats-stat-item__label">Warnings</span></div>
        <div className="ats-stat-item"><span className="ats-stat-item__num ats-stat-item__num--low">{lowCount}</span><span className="ats-stat-item__label">Minor</span></div>
        <div className="ats-stat-item"><span className="ats-stat-item__num ats-stat-item__num--accent">{analysis?.strengths?.length || 0}</span><span className="ats-stat-item__label">Strengths</span></div>
      </div>
    </div>
  );
};

export default AtsScoreOverview;
