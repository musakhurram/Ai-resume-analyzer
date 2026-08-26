import { useState } from "react";
import AtsIcon from "./AtsIcon";

const SECTION_META = [
  { key: "experience", label: "Experience", icon: "briefcase" },
  { key: "skills", label: "Skills", icon: "spark" },
  { key: "summary", label: "Summary", icon: "document" },
  { key: "formatting", label: "Formatting", icon: "ruler" },
  { key: "contactInfo", label: "Contact", icon: "contact" },
  { key: "education", label: "Education", icon: "graduation" },
];

function getScoreColor(score = 0) {
  if (score >= 80) return "score-pill--high";
  if (score >= 60) return "score-pill--med";
  return "score-pill--low";
}

const AtsSectionFeedback = ({ sections = {}, onReviseSection }) => {
  const [activeKey, setActiveKey] = useState("experience");

  const currentSection = sections[activeKey] || {
    score: 0,
    feedback: "No specific feedback generated for this section.",
    suggestions: [],
  };

  const currentMeta = SECTION_META.find((m) => m.key === activeKey) || SECTION_META[0];

  return (
    <div className="ats-sections-module glass-panel">
      <div className="ats-sections-module__header">
        <div>
          <h3 className="ats-sections-module__title">Section-by-Section Audit</h3>
          <p className="ats-sections-module__desc">
            Granular evaluation of each section against ATS token parsing rules.
          </p>
        </div>
      </div>

      {/* Compact Tabs */}
      <div className="ats-sections-tabs">
        {SECTION_META.map((meta) => {
          const sData = sections[meta.key] || { score: 0 };
          const isActive = activeKey === meta.key;
          return (
            <button
              key={meta.key}
              type="button"
              className={`ats-section-tab ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveKey(meta.key)}
            >
              <span className="ats-section-tab__icon"><AtsIcon name={meta.icon} size={15} /></span>
              <span className="ats-section-tab__name">{meta.label}</span>
              <span className={`ats-section-tab__score ${getScoreColor(sData.score)}`}>
                {sData.score ?? 0}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Section Detail Card */}
      <div className="ats-section-card">
        <div className="ats-section-card__top">
          <div className="ats-section-card__title-group">
            <span className="ats-section-card__big-icon"><AtsIcon name={currentMeta.icon} size={20} /></span>
            <div>
              <h4 className="ats-section-card__name">{currentMeta.label} Section</h4>
              <p className="ats-section-card__score-label">
                Score: <span className="ats-section-card__score-num">{currentSection.score ?? 0}/100</span>
              </p>
            </div>
          </div>

          {onReviseSection && (
            <button
              type="button"
              className="button button--secondary button--sm"
              onClick={() => onReviseSection(activeKey)}
            >
              <span>Fix with AI</span>
            </button>
          )}
        </div>

        {/* Feedback description */}
        <div className="ats-section-card__feedback">
          <p>{currentSection.feedback || "Evaluated successfully against ATS standard guidelines."}</p>
        </div>

        {/* Suggestions list */}
        {Array.isArray(currentSection.suggestions) && currentSection.suggestions.length > 0 && (
          <div className="ats-section-card__suggestions">
            <h5 className="ats-section-card__sugg-title">Suggested Improvements:</h5>
            <ul className="ats-section-card__sugg-list">
              {currentSection.suggestions.map((sug, i) => (
                <li key={i} className="ats-section-card__sugg-item">
                  <span className="ats-section-card__bullet"><AtsIcon name="arrowRight" size={14} /></span>
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AtsSectionFeedback;
